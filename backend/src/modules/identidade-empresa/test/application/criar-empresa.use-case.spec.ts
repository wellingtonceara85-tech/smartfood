import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OutboxService } from '../../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { CriarEmpresaUseCase } from '../../application/use-cases/criar-empresa.use-case';
import { EMPRESA_REPOSITORY } from '../../domain/empresa.repository';
import { EmpresaCriadaEvent } from '../../domain/events/empresa-criada.domain-event';
import { PrismaEmpresaRepository } from '../../infrastructure/prisma-empresa.repository';

describe('CriarEmpresaUseCase (integração — repositório real)', () => {
  let useCase: CriarEmpresaUseCase;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        OutboxService,
        CriarEmpresaUseCase,
        { provide: EMPRESA_REPOSITORY, useClass: PrismaEmpresaRepository },
      ],
    }).compile();

    useCase = moduleRef.get(CriarEmpresaUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria Empresa e Loja padrão no banco, na mesma operação', async () => {
    const resultado = await useCase.execute({
      nome: `Empresa Teste ${Date.now()}`,
      cnpjCpf: `cnpj-${Date.now()}`,
      categoriaNegocio: 'Pizzaria',
      telefone: '11999999999',
    });

    expect(resultado.empresaId).toBeDefined();
    expect(resultado.lojaId).toBeDefined();

    const empresaSalva = await prisma.empresa.findUnique({ where: { id: resultado.empresaId } });
    const lojaSalva = await prisma.loja.findUnique({ where: { id: resultado.lojaId } });

    expect(empresaSalva).not.toBeNull();
    expect(lojaSalva?.empresaId).toBe(resultado.empresaId);
  });

  it('publica o evento EMPRESA_CRIADA em eventos_publicados na mesma transação (ADR-0023)', async () => {
    const resultado = await useCase.execute({
      nome: `Empresa Evento ${Date.now()}`,
      cnpjCpf: `cnpj-evento-${Date.now()}`,
      categoriaNegocio: 'Marmitaria',
      telefone: '11977777777',
    });

    const eventoSalvo = await prisma.eventoPublicado.findFirst({
      where: { empresaId: resultado.empresaId, tipo: EmpresaCriadaEvent.tipo },
    });

    expect(eventoSalvo).not.toBeNull();
    expect(eventoSalvo?.statusEntrega).toBe('pendente');
    expect((eventoSalvo?.payload as { lojaId?: string })?.lojaId).toBe(resultado.lojaId);
  });
});
