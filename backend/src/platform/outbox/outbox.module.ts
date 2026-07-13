import { Global, Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';

/**
 * Global pelo mesmo motivo do PrismaModule — Serviço Compartilhado (Missão 0005, Seção 7),
 * usado por todo Bounded Context que grava Evento de Domínio, nunca lógica de negócio.
 */
@Global()
@Module({
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
