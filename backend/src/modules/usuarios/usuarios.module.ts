import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { UsuariosController } from './api/usuarios.controller';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { CriarUsuarioUseCase } from './application/use-cases/criar-usuario.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { USUARIO_REPOSITORY } from './domain/usuario.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { PrismaUsuarioRepository } from './infrastructure/prisma-usuario.repository';

/**
 * Bounded Context Usuários (Missão 0010). Exporta só a Application Service Interface (ADR-0022).
 */
@Module({
  controllers: [UsuariosController, AuthController],
  providers: [
    CriarUsuarioUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
  exports: [CriarUsuarioUseCase, LoginUseCase, RefreshTokenUseCase],
})
export class UsuariosModule {}
