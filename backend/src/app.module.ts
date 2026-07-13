import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { CozinhaModule } from './modules/cozinha/cozinha.module';
import { IdentidadeEmpresaModule } from './modules/identidade-empresa/identidade-empresa.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './platform/auth/auth.module';
import { HealthModule } from './platform/health/health.module';
import { OutboxModule } from './platform/outbox/outbox.module';
import { PrismaModule } from './platform/prisma/prisma.module';

/**
 * Raiz do Monólito Modular (ADR-0019). A partir da Missão 0009, Bounded Contexts de negócio
 * (modules/*) entram um de cada vez — Identidade & Empresa (0009), Usuários (0010),
 * Catálogo (0011), Pedidos (0012), Cozinha (0013 — façade sem Agregado próprio).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
        autoLogging: true,
        redact: ['req.headers.authorization'],
      },
    }),
    PrismaModule,
    OutboxModule,
    AuthModule,
    HealthModule,
    IdentidadeEmpresaModule,
    UsuariosModule,
    CatalogoModule,
    PedidosModule,
    CozinhaModule,
  ],
})
export class AppModule {}
