import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { LOJA_REPOSITORY } from '../../../identidade-empresa/domain/loja.repository';
import { PrismaLojaRepository } from '../../../identidade-empresa/infrastructure/prisma-loja.repository';
import { OutboxService } from '../../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CriarProdutoUseCase } from '../../application/use-cases/criar-produto.use-case';
import { CATEGORIA_REPOSITORY } from '../../domain/categoria.repository';
import { PRODUTO_REPOSITORY } from '../../domain/produto.repository';
import { PrismaCategoriaRepository } from '../../infrastructure/prisma-categoria.repository';
import { PrismaProdutoRepository } from '../../infrastructure/prisma-produto.repository';

describe('CriarProdutoUseCase (integração — repositório real)', () => {
  let useCase: CriarProdutoUseCase;
  let prisma: PrismaService;
  let empresaId: string;
  let categoriaId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        OutboxService,
        CriarProdutoUseCase,
        BuscarLojaPorEmpresaUseCase,
        { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
        { provide: PRODUTO_REPOSITORY, useClass: PrismaProdutoRepository },
        { provide: LOJA_REPOSITORY, useClass: PrismaLojaRepository },
      ],
    }).compile();

    useCase = moduleRef.get(CriarProdutoUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Catalogo ${Date.now()}`,
        cnpjCpf: `cnpj-catalogo-${Date.now()}`,
        categoriaNegocio: 'Pizzaria',
        telefone: '11999999999',
      },
    });
    empresaId = empresa.id;
    await prisma.loja.create({ data: { empresaId, nome: empresa.nome } });

    const categoria = await prisma.categoria.create({ data: { empresaId, nome: 'Bebidas' } });
    categoriaId = categoria.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria Produto + Variação, resolvendo lojaId a partir da Empresa do chamador', async () => {
    const resultado = await useCase.execute({
      empresaId,
      categoriaId,
      nome: 'Coca-Cola',
      primeiraVariacao: { nome: 'Lata 350ml', precoValor: 6.5 },
    });

    expect(resultado.produtoId).toBeDefined();

    const produtoSalvo = await prisma.produto.findUnique({
      where: { id: resultado.produtoId },
      include: { variacoes: true },
    });

    expect(produtoSalvo?.variacoes).toHaveLength(1);
    expect(produtoSalvo?.categoriaId).toBe(categoriaId);
  });

  it('publica PRODUTO_ATUALIZADO no Outbox', async () => {
    await useCase.execute({
      empresaId,
      categoriaId,
      nome: 'Guaraná',
      primeiraVariacao: { nome: 'Lata 350ml', precoValor: 5.5 },
    });

    const evento = await prisma.eventoPublicado.findFirst({
      where: { empresaId, tipo: 'PRODUTO_ATUALIZADO' },
      orderBy: { criadoEm: 'desc' },
    });

    expect(evento).not.toBeNull();
  });

  it('rejeita Categoria de outra Empresa', async () => {
    const outraEmpresa = await prisma.empresa.create({
      data: {
        nome: `Outra Empresa ${Date.now()}`,
        cnpjCpf: `cnpj-outra-${Date.now()}`,
        categoriaNegocio: 'Lanchonete',
        telefone: '11988888888',
      },
    });
    await prisma.loja.create({ data: { empresaId: outraEmpresa.id, nome: outraEmpresa.nome } });

    await expect(
      useCase.execute({
        empresaId: outraEmpresa.id,
        categoriaId,
        nome: 'Produto Invasor',
        primeiraVariacao: { nome: 'Único', precoValor: 10 },
      }),
    ).rejects.toThrow();
  });
});
