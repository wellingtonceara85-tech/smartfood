import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { PASSWORD_HASHER } from '../../application/ports/password-hasher.port';
import { CriarUsuarioUseCase } from '../../application/use-cases/criar-usuario.use-case';
import { PapelNome } from '../../domain/papel';
import { USUARIO_REPOSITORY } from '../../domain/usuario.repository';
import { BcryptPasswordHasher } from '../../infrastructure/bcrypt-password-hasher';
import { PrismaUsuarioRepository } from '../../infrastructure/prisma-usuario.repository';

describe('CriarUsuarioUseCase (integração — repositório real)', () => {
  let useCase: CriarUsuarioUseCase;
  let prisma: PrismaService;
  let empresaId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        CriarUsuarioUseCase,
        { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
        { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
      ],
    }).compile();

    useCase = moduleRef.get(CriarUsuarioUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa CriarUsuario ${Date.now()}`,
        cnpjCpf: `cnpj-usuario-${Date.now()}`,
        categoriaNegocio: 'Pizzaria',
        telefone: '11999999999',
      },
    });
    empresaId = empresa.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('bootstrap: cria o primeiro Usuário (Administrador) sem exigir autenticação', async () => {
    const resultado = await useCase.execute({
      empresaId,
      nome: 'Wellington',
      email: `wellington-${Date.now()}@smartfood.com.br`,
      senha: 'senha-forte-123',
    });

    expect(resultado.usuarioId).toBeDefined();

    const usuarioSalvo = await prisma.usuario.findUnique({
      where: { id: resultado.usuarioId },
      include: { papeis: { include: { papel: true } } },
    });
    expect(usuarioSalvo?.papeis[0]?.papel.nome).toBe(PapelNome.ADMINISTRADOR);
  });

  it('depois do bootstrap, bloqueia criação sem chamador autenticado', async () => {
    await expect(
      useCase.execute({
        empresaId,
        nome: 'Outro',
        email: `outro-${Date.now()}@smartfood.com.br`,
        senha: 'senha-forte-123',
      }),
    ).rejects.toThrow(/autentique-se/i);
  });

  it('bloqueia chamador autenticado que não é Administrador', async () => {
    await expect(
      useCase.execute({
        empresaId,
        nome: 'Outro',
        email: `outro2-${Date.now()}@smartfood.com.br`,
        senha: 'senha-forte-123',
        papel: PapelNome.OPERADOR,
        chamador: { usuarioId: 'x', empresaId, papel: PapelNome.OPERADOR },
      }),
    ).rejects.toThrow(/Administrador/i);
  });

  it('Administrador autenticado da mesma Empresa cria novo Usuário com o Papel informado', async () => {
    const resultado = await useCase.execute({
      empresaId,
      nome: 'Operador Um',
      email: `operador-${Date.now()}@smartfood.com.br`,
      senha: 'senha-forte-123',
      papel: PapelNome.OPERADOR,
      chamador: { usuarioId: 'x', empresaId, papel: PapelNome.ADMINISTRADOR },
    });

    const usuarioSalvo = await prisma.usuario.findUnique({
      where: { id: resultado.usuarioId },
      include: { papeis: { include: { papel: true } } },
    });
    expect(usuarioSalvo?.papeis[0]?.papel.nome).toBe(PapelNome.OPERADOR);
  });

  it('bloqueia Administrador autenticado de outra Empresa (Invariante 6)', async () => {
    await expect(
      useCase.execute({
        empresaId,
        nome: 'Invasor',
        email: `invasor-${Date.now()}@smartfood.com.br`,
        senha: 'senha-forte-123',
        chamador: { usuarioId: 'x', empresaId: 'outra-empresa', papel: PapelNome.ADMINISTRADOR },
      }),
    ).rejects.toThrow();
  });
});
