import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { LOJA_REPOSITORY } from '../../../identidade-empresa/domain/loja.repository';
import { PrismaLojaRepository } from '../../../identidade-empresa/infrastructure/prisma-loja.repository';
import { OutboxService } from '../../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { AlternarDisponibilidadeProdutoUseCase } from '../../application/use-cases/alternar-disponibilidade-produto.use-case';
import { AlternarDisponibilidadeVariacaoUseCase } from '../../application/use-cases/alternar-disponibilidade-variacao.use-case';
import { CriarProdutoUseCase } from '../../application/use-cases/criar-produto.use-case';
import { CATEGORIA_REPOSITORY } from '../../domain/categoria.repository';
import { PRODUTO_REPOSITORY } from '../../domain/produto.repository';
import { PrismaCategoriaRepository } from '../../infrastructure/prisma-categoria.repository';
import { PrismaProdutoRepository } from '../../infrastructure/prisma-produto.repository';

describe('AlternarDisponibilidade (Produto e Variação) — integração', () => {
  let criarProduto: CriarProdutoUseCase;
  let alternarProduto: AlternarDisponibilidadeProdutoUseCase;
  let alternarVariacao: AlternarDisponibilidadeVariacaoUseCase;
  let prisma: PrismaService;
  let empresaId: string;
  let categoriaId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        OutboxService,
        CriarProdutoUseCase,
        AlternarDisponibilidadeProdutoUseCase,
        AlternarDisponibilidadeVariacaoUseCase,
        BuscarLojaPorEmpresaUseCase,
        { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
        { provide: PRODUTO_REPOSITORY, useClass: PrismaProdutoRepository },
        { provide: LOJA_REPOSITORY, useClass: PrismaLojaRepository },
      ],
    }).compile();

    criarProduto = moduleRef.get(CriarProdutoUseCase);
    alternarProduto = moduleRef.get(AlternarDisponibilidadeProdutoUseCase);
    alternarVariacao = moduleRef.get(AlternarDisponibilidadeVariacaoUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Disponibilidade ${Date.now()}`,
        cnpjCpf: `cnpj-disp-${Date.now()}`,
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

  it('alterna a disponibilidade do Produto', async () => {
    const { produtoId } = await criarProduto.execute({
      empresaId,
      categoriaId,
      nome: 'Suco',
      primeiraVariacao: { nome: 'Único', precoValor: 8 },
    });

    const resultado = await alternarProduto.execute(produtoId, empresaId);
    expect(resultado.disponivel).toBe(false);

    const resultado2 = await alternarProduto.execute(produtoId, empresaId);
    expect(resultado2.disponivel).toBe(true);
  });

  it('Invariante 2 — desligar a única Variação desliga o Produto junto, e religá-la não reativa', async () => {
    const { produtoId } = await criarProduto.execute({
      empresaId,
      categoriaId,
      nome: 'Água',
      primeiraVariacao: { nome: 'Único', precoValor: 4 },
    });

    const produtoCriado = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { variacoes: true },
    });
    const variacaoId = produtoCriado!.variacoes[0].id;

    const aposDesligarVariacao = await alternarVariacao.execute(produtoId, variacaoId, empresaId);
    expect(aposDesligarVariacao.variacoes[0].disponivel).toBe(false);
    expect(aposDesligarVariacao.disponivel).toBe(false);

    const aposReligarVariacao = await alternarVariacao.execute(produtoId, variacaoId, empresaId);
    expect(aposReligarVariacao.variacoes[0].disponivel).toBe(true);
    expect(aposReligarVariacao.disponivel).toBe(false); // não reativa sozinho
  });

  it('rejeita ligar o Produto manualmente com 400 (não 500) quando nenhuma Variação está disponível', async () => {
    const { produtoId } = await criarProduto.execute({
      empresaId,
      categoriaId,
      nome: 'Refrigerante',
      primeiraVariacao: { nome: 'Único', precoValor: 6 },
    });

    const produtoCriado = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { variacoes: true },
    });
    const variacaoId = produtoCriado!.variacoes[0].id;

    await alternarVariacao.execute(produtoId, variacaoId, empresaId); // desliga a única Variação

    await expect(alternarProduto.execute(produtoId, empresaId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('bloqueia alternar Produto de outra Empresa', async () => {
    const { produtoId } = await criarProduto.execute({
      empresaId,
      categoriaId,
      nome: 'Chá',
      primeiraVariacao: { nome: 'Único', precoValor: 5 },
    });

    await expect(alternarProduto.execute(produtoId, 'outra-empresa-qualquer')).rejects.toThrow();
  });
});
