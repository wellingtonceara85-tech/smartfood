import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Serviço Compartilhado de Health Check (Missão 0005, Seção 7 e 13).
 * Não é um Bounded Context de negócio — vive em platform/, nunca em modules/.
 */
@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
