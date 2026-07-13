import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthTokenService } from '../../../../platform/auth/auth-token.service';
import { obterJwtSecret } from '../../../../platform/auth/jwt-secret';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { PASSWORD_HASHER } from '../../application/ports/password-hasher.port';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { PapelNome } from '../../domain/papel';
import { USUARIO_REPOSITORY } from '../../domain/usuario.repository';
import { BcryptPasswordHasher } from '../../infrastructure/bcrypt-password-hasher';
import { PrismaUsuarioRepository } from '../../infrastructure/prisma-usuario.repository';

describe('LoginUseCase (integração — repositório real)', () => {
  let loginUseCase: LoginUseCase;
  let prisma: PrismaService;
  let empresaId: string;
  const senha = 'senha-forte-123';
  const email = `login-${Date.now()}@smartfood.com.br`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: obterJwtSecret() })],
      providers: [
        PrismaService,
        AuthTokenService,
        LoginUseCase,
        { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
        { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
      ],
    }).compile();

    loginUseCase = moduleRef.get(LoginUseCase);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();

    const empresa = await prisma.empresa.create({
      data: {
        nome: `Empresa Login ${Date.now()}`,
        cnpjCpf: `cnpj-login-${Date.now()}`,
        categoriaNegocio: 'Lanchonete',
        telefone: '11988888888',
      },
    });
    empresaId = empresa.id;

    const papel = await prisma.papel.findUniqueOrThrow({
      where: { nome: PapelNome.ADMINISTRADOR },
    });
    const hasher = new BcryptPasswordHasher();
    await prisma.usuario.create({
      data: {
        empresaId,
        nome: 'Wellington',
        email,
        senhaHash: await hasher.hash(senha),
        papeis: { create: { papelId: papel.id } },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('retorna Access+Refresh Token para credenciais corretas', async () => {
    const tokens = await loginUseCase.execute({ empresaId, email, senha });
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('rejeita senha errada', async () => {
    await expect(
      loginUseCase.execute({ empresaId, email, senha: 'senha-errada' }),
    ).rejects.toThrow();
  });

  it('rejeita e-mail inexistente', async () => {
    await expect(
      loginUseCase.execute({ empresaId, email: 'nao-existe@smartfood.com.br', senha }),
    ).rejects.toThrow();
  });
});
