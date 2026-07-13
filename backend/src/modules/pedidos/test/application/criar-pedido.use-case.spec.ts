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
import { CriarPedidoUseCase } from '../../application/use-cases/criar-pedido.use-case';
import { CanalVenda } from '../../domain/canal-venda';
import { PEDIDO_REPOSITORY } from '../../domain/pedido.repository';
import { PrismaPedidoRepository } from '../../infrastructure/prisma-pedido.repository';

describe('CriarPedidoUseCase (integração — repositório real)', () => {
  let useCase: CriarPedidoUseCase;
  let prisma: PrismaService;
  let empresaId: string;
  let produtoDisponivelId: string;
  let variacaoDisponivelId: string;
  let produtoIndisponivelId: string;
  let variacaoIndisponivelId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        OutboxService,
        CriarPedidoUseCase,
        BuscarProdutoParaPedidoUseCase,
        BuscarLojaPorEmpresaUseCase,
        { provide: PEDIDO_REPOSITORY, useClass: PrismaPedidoRepository },
        { provide: PRODUTO_REPOSITORY, useClass: PrismaProdutoRepository },
        { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
        { provide: LOJA_REPOSITORY, useClass: PrismaLojaRepository },
      ],
    }).compile();

    useCase = moduleRef.get(CriarPedidoUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Pedidos ${Date.now()}`,
        cnpjCpf: `cnpj-pedidos-${Date.now()}`,
        categoriaNegocio: 'Pizzaria',
        telefone: '11999999999',
      },
    });
    empresaId = empresa.id;
    await prisma.loja.create({ data: { empresaId, nome: empresa.nome } });

    const categoria = await prisma.categoria.create({ data: { empresaId, nome: 'Bebidas' } });

    const produtoDisponivel = await prisma.produto.create({
      data: {
        lojaId: (await prisma.loja.findFirstOrThrow({ where: { empresaId } })).id,
        categoriaId: categoria.id,
        nome: 'Coca-Cola',
        variacoes: { create: { nome: 'Lata 350ml', precoValor: 6.5, codigoInterno: 'SKU-001' } },
      },
      include: { variacoes: true },
    });
    produtoDisponivelId = produtoDisponivel.id;
    variacaoDisponivelId = produtoDisponivel.variacoes[0].id;

    const produtoIndisponivel = await prisma.produto.create({
      data: {
        lojaId: (await prisma.loja.findFirstOrThrow({ where: { empresaId } })).id,
        categoriaId: categoria.id,
        nome: 'Guaraná (esgotado)',
        disponivel: false,
        variacoes: { create: { nome: 'Lata 350ml', precoValor: 5.5, disponivel: false } },
      },
      include: { variacoes: true },
    });
    produtoIndisponivelId = produtoIndisponivel.id;
    variacaoIndisponivelId = produtoIndisponivel.variacoes[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria Pedido com snapshot completo (nome, SKU, preço) e valorTotal correto', async () => {
    const resultado = await useCase.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId: produtoDisponivelId, variacaoId: variacaoDisponivelId, quantidade: 2 }],
    });

    expect(resultado.pedidoId).toBeDefined();

    const pedidoSalvo = await prisma.pedido.findUnique({
      where: { id: resultado.pedidoId },
      include: { itens: true, historico: true },
    });

    expect(pedidoSalvo?.itens).toHaveLength(1);
    expect(pedidoSalvo?.itens[0].nomeProduto).toBe('Coca-Cola');
    expect(pedidoSalvo?.itens[0].codigoInternoVariacao).toBe('SKU-001');
    expect(Number(pedidoSalvo?.valorTotal)).toBe(13);
    expect(pedidoSalvo?.status).toBe('AGUARDANDO_PAGAMENTO');
    expect(pedidoSalvo?.historico).toHaveLength(1);
    expect(pedidoSalvo?.historico[0].status).toBe('AGUARDANDO_PAGAMENTO');
  });

  it('publica PEDIDO_CRIADO no Outbox', async () => {
    const resultado = await useCase.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.MESA,
      itens: [{ produtoId: produtoDisponivelId, variacaoId: variacaoDisponivelId, quantidade: 1 }],
    });

    const evento = await prisma.eventoPublicado.findFirst({
      where: { empresaId, tipo: 'PEDIDO_CRIADO' },
      orderBy: { criadoEm: 'desc' },
    });

    expect(evento).not.toBeNull();
    expect((evento?.payload as { pedidoId?: string })?.pedidoId).toBe(resultado.pedidoId);
  });

  it('rejeita Produto indisponível (400)', async () => {
    await expect(
      useCase.execute({
        empresaId,
        criadoPorUsuarioId: 'usuario-1',
        canalVenda: CanalVenda.BALCAO,
        itens: [
          { produtoId: produtoIndisponivelId, variacaoId: variacaoIndisponivelId, quantidade: 1 },
        ],
      }),
    ).rejects.toThrow(/não está disponível/i);
  });

  it('rejeita Produto/Variação inexistente', async () => {
    await expect(
      useCase.execute({
        empresaId,
        criadoPorUsuarioId: 'usuario-1',
        canalVenda: CanalVenda.BALCAO,
        itens: [{ produtoId: 'produto-inexistente', variacaoId: 'variacao-x', quantidade: 1 }],
      }),
    ).rejects.toThrow(/não encontrado/i);
  });

  it('rejeita Produto de outra Empresa', async () => {
    const outraEmpresa = await prisma.empresa.create({
      data: {
        nome: `Outra Empresa Pedidos ${Date.now()}`,
        cnpjCpf: `cnpj-outra-pedidos-${Date.now()}`,
        categoriaNegocio: 'Lanchonete',
        telefone: '11988888888',
      },
    });
    await prisma.loja.create({ data: { empresaId: outraEmpresa.id, nome: outraEmpresa.nome } });

    await expect(
      useCase.execute({
        empresaId: outraEmpresa.id,
        criadoPorUsuarioId: 'usuario-1',
        canalVenda: CanalVenda.BALCAO,
        itens: [
          { produtoId: produtoDisponivelId, variacaoId: variacaoDisponivelId, quantidade: 1 },
        ],
      }),
    ).rejects.toThrow();
  });
});
