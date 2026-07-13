import { Injectable } from '@nestjs/common';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ProdutoAtualizadoEvent } from '../domain/events/produto-atualizado.domain-event';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import { ProdutoMapper } from './produto.mapper';

const INCLUDE_VARIACOES = { variacoes: true } as const;

/**
 * Único lugar do módulo que importa PrismaClient diretamente (Missão 0007.5, Seção 4.3).
 * Upsert (não create/update separados) — mesma operação serve para criação e para as
 * trocas de disponibilidade, sem duplicar lógica de escrita.
 */
@Injectable()
export class PrismaProdutoRepository implements ProdutoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async salvar(produto: Produto, empresaId: string): Promise<void> {
    const dados = produto.paraPersistencia();

    await this.prisma.$transaction(async (tx) => {
      await tx.produto.upsert({
        where: { id: dados.id },
        create: {
          id: dados.id,
          lojaId: dados.lojaId,
          categoriaId: dados.categoriaId,
          nome: dados.nome,
          descricao: dados.descricao,
          imagemUrl: dados.imagemUrl,
          controlaEstoque: dados.controlaEstoque,
          disponivel: dados.disponivel,
          criadoEm: dados.criadoEm,
        },
        update: {
          nome: dados.nome,
          descricao: dados.descricao,
          imagemUrl: dados.imagemUrl,
          controlaEstoque: dados.controlaEstoque,
          disponivel: dados.disponivel,
        },
      });

      for (const variacao of dados.variacoes) {
        await tx.variacaoProduto.upsert({
          where: { id: variacao.id },
          create: {
            id: variacao.id,
            produtoId: dados.id,
            nome: variacao.nome,
            precoValor: variacao.precoValor,
            precoMoeda: variacao.precoMoeda,
            codigoInterno: variacao.codigoInterno,
            disponivel: variacao.disponivel,
          },
          update: { disponivel: variacao.disponivel },
        });
      }

      const evento = new ProdutoAtualizadoEvent(dados.id, dados.lojaId, new Date());
      await this.outbox.registrar(tx, {
        tipo: ProdutoAtualizadoEvent.tipo,
        agregadoOrigem: 'Produto',
        empresaId,
        payload: {
          produtoId: evento.produtoId,
          lojaId: evento.lojaId,
          ocorridoEm: evento.ocorridoEm.toISOString(),
        },
      });
    });
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const registro = await this.prisma.produto.findUnique({
      where: { id },
      include: INCLUDE_VARIACOES,
    });
    return registro ? ProdutoMapper.paraDominio(registro) : null;
  }

  async listarPorLoja(lojaId: string): Promise<Produto[]> {
    const registros = await this.prisma.produto.findMany({
      where: { lojaId },
      include: INCLUDE_VARIACOES,
    });
    return registros.map((r) => ProdutoMapper.paraDominio(r));
  }
}
