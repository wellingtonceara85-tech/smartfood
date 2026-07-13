import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { CozinhaController } from './api/cozinha.controller';

/**
 * Módulo façade (Missão 0013) — sem `domain/`, sem `infrastructure/`, sem Agregado próprio.
 * Só importa `PedidosModule` e orquestra os Use Cases que ele exporta (ADR-0022). Nada aqui
 * exporta nada — Cozinha não é consumida por nenhum outro Bounded Context.
 */
@Module({
  imports: [PedidosModule],
  controllers: [CozinhaController],
})
export class CozinhaModule {}
