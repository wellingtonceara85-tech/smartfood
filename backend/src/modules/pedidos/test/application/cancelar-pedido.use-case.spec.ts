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
import { CancelarPedidoUseCase } from '../../application/use-cases/cancelar-pedido.use-case';
import { CriarPedidoUseCase } from '../../application/use-cases/criar-pedido.use-case';
import { CanalVenda } from '../../domain/canal-venda';
import { PEDIDO_REPOSITORY } from '../../domain/pedido.repository';
import { PrismaPedidoRepository } from '../../infrastructure/prisma-pedido.repository';

describe('CancelarPedidoUseCase (integração — repositório real)', () => {
  let criarPedido: CriarPedidoUseCase;
  let cancelarPedido: CancelarPedidoUseCase;
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
        CancelarPedidoUseCase,
        BuscarProdutoParaPedidoUseCase,
        BuscarLojaPorEmpresaUseCase,
        { provide: PEDIDO_REPOSITORY, useClass: PrismaPedidoRepository },
        { provide: PRODUTO_REPOSITORY, useClass: PrismaProdutoRepository },
        { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
        { provide: LOJA_REPOSITORY, useClass: PrismaLojaRepository },
      ],
    }).compile();

    criarPedido = moduleRef.get(CriarPedidoUseCase);
    cancelarPedido = moduleRef.get(CancelarPedidoUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Cancelamento ${Date.now()}`,
        cnpjCpf: `cnpj-cancel-${Date.now()}`,
        categoriaNegocio: 'Pizzaria',
        telefone: '11999999999',
      },
    });
    empresaId = empresa.id;
    const loja = await prisma.loja.create({ data: { empresaId, nome: empresa.nome } });
    const categoria = await prisma.categoria.create({ data: { empresaId, nome: 'Bebidas' } });

    const produto = await prisma.produto.create({
      data: {
        lojaId: loja.id,
        categoriaId: categoria.id,
        nome: 'Suco',
        variacoes: { create: { nome: 'Único', precoValor: 8 } },
      },
      include: { variacoes: true },
    });
    produtoId = produto.id;
    variacaoId = produto.variacoes[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cancela um Pedido em Aguardando Pagamento e publica PEDIDO_CANCELADO', async () => {
    const { pedidoId } = await criarPedido.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId, variacaoId, quantidade: 1 }],
    });

    const resultado = await cancelarPedido.execute(pedidoId, empresaId);
    expect(resultado.status).toBe('CANCELADO');

    const evento = await prisma.eventoPublicado.findFirst({
      where: { empresaId, tipo: 'PEDIDO_CANCELADO' },
      orderBy: { criadoEm: 'desc' },
    });
    expect(evento).not.toBeNull();

    const historico = await prisma.historicoStatusPedido.findMany({
      where: { pedidoId },
      orderBy: { ocorridoEm: 'asc' },
    });
    expect(historico.map((h) => h.status)).toEqual(['AGUARDANDO_PAGAMENTO', 'CANCELADO']);
  });

  it('rejeita cancelar um Pedido já Cancelado (400, não 500)', async () => {
    const { pedidoId } = await criarPedido.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId, variacaoId, quantidade: 1 }],
    });

    await cancelarPedido.execute(pedidoId, empresaId);

    await expect(cancelarPedido.execute(pedidoId, empresaId)).rejects.toThrow(/estado final/i);
  });

  it('bloqueia cancelar Pedido de outra Empresa', async () => {
    const { pedidoId } = await criarPedido.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId, variacaoId, quantidade: 1 }],
    });

    await expect(cancelarPedido.execute(pedidoId, 'outra-empresa-qualquer')).rejects.toThrow();
  });
});
