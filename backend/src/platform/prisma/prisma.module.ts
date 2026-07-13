import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global para evitar reimportação em todo módulo — mas continua sendo Serviço Compartilhado
 * (Missão 0005, Seção 7), nunca lógica de negócio de um Bounded Context.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
