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
import { AvancarPedidoParaEmPreparoUseCase } from '../../application/use-cases/avancar-pedido-para-em-preparo.use-case';
import { AvancarPedidoParaProntoUseCase } from '../../application/use-cases/avancar-pedido-para-pronto.use-case';
import { CriarPedidoUseCase } from '../../application/use-cases/criar-pedido.use-case';
import { CanalVenda } from '../../domain/canal-venda';
import { PEDIDO_REPOSITORY } from '../../domain/pedido.repository';
import { PrismaPedidoRepository } from '../../infrastructure/prisma-pedido.repository';

describe('AvancarPedidoPara{EmPreparo,Pronto}UseCase (integração — repositório real)', () => {
  let criarPedido: CriarPedidoUseCase;
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
    avancarParaEmPreparo = moduleRef.get(AvancarPedidoParaEmPreparoUseCase);
    avancarParaPronto = moduleRef.get(AvancarPedidoParaProntoUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Cozinha ${Date.now()}`,
        cnpjCpf: `cnpj-cozinha-${Date.now()}`,
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

  async function criarPedidoEmRecebido(): Promise<string> {
    const { pedidoId } = await criarPedido.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId, variacaoId, quantidade: 1 }],
    });
    // Simula Pagamento Confirmado (Missão 0014, não construída ainda) via fixture direta —
    // nunca via Caso de Uso de negócio (Missão 0013, Seção 2, Correção 2).
    await prisma.pedido.update({ where: { id: pedidoId }, data: { status: 'RECEBIDO' } });
    return pedidoId;
  }

  it('iniciar(): Recebido → Em Preparo, publica PEDIDO_EM_PREPARO e nova linha de histórico', async () => {
    const pedidoId = await criarPedidoEmRecebido();

    const resultado = await avancarParaEmPreparo.execute(pedidoId, empresaId);
    expect(resultado.status).toBe('EM_PREPARO');

    const evento = await prisma.eventoPublicado.findFirst({
      where: { empresaId, tipo: 'PEDIDO_EM_PREPARO' },
      orderBy: { criadoEm: 'desc' },
    });
    expect(evento).not.toBeNull();

    const historico = await prisma.historicoStatusPedido.findMany({ where: { pedidoId } });
    expect(historico.map((h) => h.status)).toContain('EM_PREPARO');
  });

  it('iniciar(): rejeita com 400 se o Pedido não estiver em Recebido', async () => {
    const { pedidoId } = await criarPedido.execute({
      empresaId,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      itens: [{ produtoId, variacaoId, quantidade: 1 }],
    }); // fica em AGUARDANDO_PAGAMENTO, não Recebido

    await expect(avancarParaEmPreparo.execute(pedidoId, empresaId)).rejects.toThrow(
      /não pode transitar/i,
    );
  });

  it('finalizar(): Em Preparo → Pronto, publica PEDIDO_PRONTO', async () => {
    const pedidoId = await criarPedidoEmRecebido();
    await avancarParaEmPreparo.execute(pedidoId, empresaId);

    const resultado = await avancarParaPronto.execute(pedidoId, empresaId);
    expect(resultado.status).toBe('PRONTO');

    const evento = await prisma.eventoPublicado.findFirst({
      where: { empresaId, tipo: 'PEDIDO_PRONTO' },
      orderBy: { criadoEm: 'desc' },
    });
    expect(evento).not.toBeNull();
  });

  it('finalizar(): rejeita com 400 se o Pedido não estiver em Em Preparo', async () => {
    const pedidoId = await criarPedidoEmRecebido(); // fica em Recebido, não Em Preparo

    await expect(avancarParaPronto.execute(pedidoId, empresaId)).rejects.toThrow(
      /não pode transitar/i,
    );
  });

  it('bloqueia avançar Pedido de outra Empresa', async () => {
    const pedidoId = await criarPedidoEmRecebido();
    await expect(
      avancarParaEmPreparo.execute(pedidoId, 'outra-empresa-qualquer'),
    ).rejects.toThrow();
  });
});
