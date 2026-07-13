import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BuscarProdutoParaPedidoUseCase } from '../../../catalogo/application/use-cases/buscar-produto-para-pedido.use-case';
import { CATEGORIA_REPOSITORY } from '../../../catalogo/domain/categoria.repository';
import { PRODUTO_REPOSITORY } from '../../../catalogo/domain/produto.repository';
import { PrismaCategoriaRepository } from '../../../catalogo/infrastructure/prisma-categoria.repository';
import { PrismaProdutoRepository } from '../../../catalogo/infrastructure/prisma-produto.repository';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { LOJA_REPOSITORY } from '../../../identidade-empresa/domain/loja.repository';
import { PrismaLojaRepository } from '../../../identidade-empresa/infrastructure/prisma-loja.repository';
import { OutboxService } from '../../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { AvancarPedidoParaEmPreparoUseCase } from '../../../pedidos/application/use-cases/avancar-pedido-para-em-preparo.use-case';
import { AvancarPedidoParaProntoUseCase } from '../../../pedidos/application/use-cases/avancar-pedido-para-pronto.use-case';
import { CriarPedidoUseCase } from '../../../pedidos/application/use-cases/criar-pedido.use-case';
import { ListarPedidosPorStatusUseCase } from '../../../pedidos/application/use-cases/listar-pedidos-por-status.use-case';
import { CanalVenda } from '../../../pedidos/domain/canal-venda';
import { PEDIDO_REPOSITORY } from '../../../pedidos/domain/pedido.repository';
import { PrismaPedidoRepository } from '../../../pedidos/infrastructure/prisma-pedido.repository';

describe('Fila da Cozinha — ListarPedidosPorStatusUseCase (integração — repositório real)', () => {
  let criarPedido: CriarPedidoUseCase;
  let listarPorStatus: ListarPedidosPorStatusUseCase;
  let avancarParaEmPreparo: AvancarPedidoParaEmPreparoUseCase;
  let avancarParaPronto: AvancarPedidoParaProntoUseCase;
  let prisma: PrismaService;
  let empresaId: string;
  let produtoId: string;
  let variacaoId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        OutboxService,
        CriarPedidoUseCase,
        ListarPedidosPorStatusUseCase,
        AvancarPedidoParaEmPreparoUseCase,
        AvancarPedidoParaProntoUseCase,
        BuscarProdutoParaPedidoUseCase,
        BuscarLojaPorEmpresaUseCase,
        { provide: PEDIDO_REPOSITORY, useClass: PrismaPedidoRepository },
        { provide: PRODUTO_REPOSITORY, useClass: PrismaProdutoRepository },
        { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
        { provide: LOJA_REPOSITORY, useClass: PrismaLojaRepository },
      ],
    }).compile();

    criarPedido = moduleRef.get(CriarPedidoUseCase);
    listarPorStatus = moduleRef.get(ListarPedidosPorStatusUseCase);
    avancarParaEmPreparo = moduleRef.get(AvancarPedidoParaEmPreparoUseCase);
    avancarParaPronto = moduleRef.get(AvancarPedidoParaProntoUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Fila Cozinha ${Date.now()}`,
        cnpjCpf: `cnpj-fila-${Date.now()}`,
        categoriaNegocio: 'Pizzaria',
        telefone: '11999999999',
      },
    });
    empresaId = empresa.id;
    const loja = await prisma.loja.create({ data: { empresaId, nome: empresa.nome } });
    const categoria = await prisma.categoria.create({ data: { empresaId, nome: 'Pizzas' } });

    const produto = await prisma.produto.create({
      data: {
        lojaId: loja.id,
        categoriaId: categoria.id,
        nome: 'Pizza',
        variacoes: { create: { nome: 'Média', precoValor: 40 } },
      },
      include: { variacoes: true },
    });
    produtoId = produto.id;
    variacaoId = produto.variacoes[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function novoPedidoComStatus(status: string): Promise<string> {
    const { pedidoId } = await criarPedido.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId, variacaoId, quantidade: 1 }],
    });
    await prisma.pedido.update({ where: { id: pedidoId }, data: { status } });
    return pedidoId;
  }

  it('lista Pedidos em Recebido e Em Preparo', async () => {
    const recebidoId = await novoPedidoComStatus('RECEBIDO');
    const emPreparoId = await novoPedidoComStatus('EM_PREPARO');
    await novoPedidoComStatus('AGUARDANDO_PAGAMENTO');

    const fila = await listarPorStatus.execute(empresaId, ['RECEBIDO', 'EM_PREPARO']);
    const idsNaFila = fila.map((p) => p.id);

    expect(idsNaFila).toContain(recebidoId);
    expect(idsNaFila).toContain(emPreparoId);
  });

  it('Invariante (Missão 0013, revisão) — um Pedido em Pronto nunca aparece na fila', async () => {
    const recebidoId = await novoPedidoComStatus('RECEBIDO');
    await avancarParaEmPreparo.execute(recebidoId, empresaId);
    await avancarParaPronto.execute(recebidoId, empresaId);

    const fila = await listarPorStatus.execute(empresaId, ['RECEBIDO', 'EM_PREPARO']);

    expect(fila.map((p) => p.id)).not.toContain(recebidoId);
    expect(fila.every((p) => p.status !== 'PRONTO')).toBe(true);
  });
});
