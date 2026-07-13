import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CriarCategoriaUseCase } from '../../application/use-cases/criar-categoria.use-case';
import { ListarCategoriasUseCase } from '../../application/use-cases/listar-categorias.use-case';
import { CATEGORIA_REPOSITORY } from '../../domain/categoria.repository';
import { PrismaCategoriaRepository } from '../../infrastructure/prisma-categoria.repository';

describe('CriarCategoriaUseCase / ListarCategoriasUseCase (integração — repositório real)', () => {
  let criar: CriarCategoriaUseCase;
  let listar: ListarCategoriasUseCase;
  let prisma: PrismaService;
  const empresaId = `empresa-categoria-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        CriarCategoriaUseCase,
        ListarCategoriasUseCase,
        { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
      ],
    }).compile();

    criar = moduleRef.get(CriarCategoriaUseCase);
    listar = moduleRef.get(ListarCategoriasUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria e lista Categorias só da Empresa informada', async () => {
    await criar.execute({ empresaId, nome: 'Pizzas' });
    await criar.execute({ empresaId, nome: 'Bebidas' });
    await criar.execute({ empresaId: `outra-${empresaId}`, nome: 'Não deve aparecer' });

    const categorias = await listar.execute(empresaId);
    expect(categorias).toHaveLength(2);
    expect(categorias.map((c) => c.nome).sort()).toEqual(['Bebidas', 'Pizzas']);
  });
});
