import { Injectable } from '@nestjs/common';
import type {
  CanalVenda as CanalVendaPrisma,
  StatusPedido as StatusPedidoPrisma,
} from '@prisma/client';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PedidoCanceladoEvent } from '../domain/events/pedido-cancelado.domain-event';
import { PedidoCriadoEvent } from '../domain/events/pedido-criado.domain-event';
import { PedidoEmPreparoEvent } from '../domain/events/pedido-em-preparo.domain-event';
import { PedidoProntoEvent } from '../domain/events/pedido-pronto.domain-event';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { StatusPedido } from '../domain/status-pedido';
import { PedidoMapper } from './pedido.mapper';

const INCLUDE_ITENS = { itens: true } as const;

/** Evento a publicar quando o Pedido MUDA (não cria) para este status — sem entrada = sem evento nesta missão. */
const EVENTO_POR_TRANSICAO: Partial<Record<StatusPedido, string>> = {
  [StatusPedido.CANCELADO]: PedidoCanceladoEvent.tipo,
  [StatusPedido.EM_PREPARO]: PedidoEmPreparoEvent.tipo,
  [StatusPedido.PRONTO]: PedidoProntoEvent.tipo,
};

/**
 * Único lugar do módulo que importa PrismaClient diretamente (Missão 0007.5, Seção 4.3).
 * `salvar` serve para criação e para toda transição de status — decide qual evento publicar
 * comparando com o histórico já persistido: sem histórico prévio = criação (`PEDIDO_CRIADO`);
 * histórico prévio com status novo = transição, evento resolvido via `EVENTO_POR_TRANSICAO`
 * (Missão 0013 acrescenta EM_PREPARO/PRONTO ao que a Missão 0012 já tinha para CANCELADO).
 * Histórico nasce com a primeira linha já na criação (Missão 0012, Seção 2, revisão).
 */
@Injectable()
export class PrismaPedidoRepository implements PedidoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async salvar(pedido: Pedido): Promise<void> {
    const dados = pedido.paraPersistencia();
    const statusAtual = dados.status as unknown as StatusPedidoPrisma;

    await this.prisma.$transaction(async (tx) => {
      await tx.pedido.upsert({
        where: { id: dados.id },
        create: {
          id: dados.id,
          empresaId: dados.empresaId,
          clienteId: dados.clienteId,
          criadoPorUsuarioId: dados.criadoPorUsuarioId,
          canalVenda: dados.canalVenda as unknown as CanalVendaPrisma,
          status: statusAtual,
          valorTotal: dados.valorTotal,
          enderecoRua: dados.enderecoEntrega?.rua,
          enderecoNumero: dados.enderecoEntrega?.numero,
          enderecoBairro: dados.enderecoEntrega?.bairro,
          enderecoCidade: dados.enderecoEntrega?.cidade,
          enderecoCep: dados.enderecoEntrega?.cep,
          enderecoComplemento: dados.enderecoEntrega?.complemento,
          criadoEm: dados.criadoEm,
        },
        update: {
          status: statusAtual,
        },
      });

      for (const item of dados.itens) {
        await tx.itemPedido.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            pedidoId: dados.id,
            produtoId: item.produtoId,
            variacaoId: item.variacaoId,
            nomeProduto: item.nomeProduto,
            nomeVariacao: item.nomeVariacao,
            descricaoProduto: item.descricaoProduto,
            codigoInternoVariacao: item.codigoInternoVariacao,
            precoValor: item.precoValor,
            precoMoeda: item.precoMoeda,
            quantidade: item.quantidade,
          },
          update: {},
        });
      }

      const ultimoHistorico = await tx.historicoStatusPedido.findFirst({
        where: { pedidoId: dados.id },
        orderBy: { ocorridoEm: 'desc' },
      });
      const ehCriacao = !ultimoHistorico;
      const statusMudou = !ultimoHistorico || ultimoHistorico.status !== statusAtual;

      if (statusMudou) {
        await tx.historicoStatusPedido.create({
          data: { pedidoId: dados.id, status: statusAtual },
        });
      }

      if (ehCriacao) {
        const evento = new PedidoCriadoEvent(dados.id, dados.empresaId, new Date());
        await this.outbox.registrar(tx, {
          tipo: PedidoCriadoEvent.tipo,
          agregadoOrigem: 'Pedido',
          empresaId: dados.empresaId,
          payload: { pedidoId: evento.pedidoId, ocorridoEm: evento.ocorridoEm.toISOString() },
        });
      } else if (statusMudou) {
        const tipoEvento = EVENTO_POR_TRANSICAO[dados.status];
        if (tipoEvento) {
          await this.outbox.registrar(tx, {
            tipo: tipoEvento,
            agregadoOrigem: 'Pedido',
            empresaId: dados.empresaId,
            payload: { pedidoId: dados.id, ocorridoEm: new Date().toISOString() },
          });
        }
      }
    });
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    const registro = await this.prisma.pedido.findUnique({
      where: { id },
      include: INCLUDE_ITENS,
    });
    return registro ? PedidoMapper.paraDominio(registro) : null;
  }

  async listarPorEmpresa(empresaId: string): Promise<Pedido[]> {
    const registros = await this.prisma.pedido.findMany({
      where: { empresaId },
      include: INCLUDE_ITENS,
    });
    return registros.map((r) => PedidoMapper.paraDominio(r));
  }

  async listarPorEmpresaEStatus(empresaId: string, status: StatusPedido[]): Promise<Pedido[]> {
    const registros = await this.prisma.pedido.findMany({
      where: { empresaId, status: { in: status as unknown as StatusPedidoPrisma[] } },
      include: INCLUDE_ITENS,
    });
    return registros.map((r) => PedidoMapper.paraDominio(r));
  }
}
