import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OutboxService } from '../../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { BuscarEmpresaPorIdUseCase } from '../../application/use-cases/buscar-empresa-por-id.use-case';
import { CriarEmpresaUseCase } from '../../application/use-cases/criar-empresa.use-case';
import { EMPRESA_REPOSITORY } from '../../domain/empresa.repository';
import { PrismaEmpresaRepository } from '../../infrastructure/prisma-empresa.repository';

describe('BuscarEmpresaPorIdUseCase (integração — repositório real)', () => {
  let criar: CriarEmpresaUseCase;
  let buscar: BuscarEmpresaPorIdUseCase;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        OutboxService,
        CriarEmpresaUseCase,
        BuscarEmpresaPorIdUseCase,
        { provide: EMPRESA_REPOSITORY, useClass: PrismaEmpresaRepository },
      ],
    }).compile();

    criar = moduleRef.get(CriarEmpresaUseCase);
    buscar = moduleRef.get(BuscarEmpresaPorIdUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('retorna a Empresa criada', async () => {
    const criado = await criar.execute({
      nome: `Empresa Busca ${Date.now()}`,
      cnpjCpf: `cnpj-busca-${Date.now()}`,
      categoriaNegocio: 'Lanchonete',
      telefone: '11988888888',
    });

    const encontrada = await buscar.execute(criado.empresaId);

    expect(encontrada?.id).toBe(criado.empresaId);
  });

  it('retorna null quando a Empresa não existe', async () => {
    const encontrada = await buscar.execute('00000000-0000-0000-0000-000000000000');
    expect(encontrada).toBeNull();
  });
});
