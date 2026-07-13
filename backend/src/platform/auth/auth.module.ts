import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthTokenService } from './auth-token.service';
import { ExtratorUsuarioOpcional } from './extrator-usuario-opcional';
import { JwtAuthGuard } from './jwt-auth.guard';
import { obterJwtSecret } from './jwt-secret';
import { JwtStrategy } from './jwt.strategy';
import { PapelPermissaoGuard } from './papel-permissao.guard';

/**
 * Global pelo mesmo motivo do PrismaModule/OutboxModule — mecanismo de plataforma
 * (Missão 0005, Seção 7), usado por qualquer módulo que precise proteger uma rota.
 */
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: obterJwtSecret(),
    }),
  ],
  providers: [
    JwtStrategy,
    AuthTokenService,
    JwtAuthGuard,
    PapelPermissaoGuard,
    ExtratorUsuarioOpcional,
  ],
  exports: [AuthTokenService, JwtAuthGuard, PapelPermissaoGuard, ExtratorUsuarioOpcional],
})
export class AuthModule {}
