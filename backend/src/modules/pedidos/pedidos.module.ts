import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { PedidoController } from './api/pedido.controller';
import { AvancarPedidoParaEmPreparoUseCase } from './application/use-cases/avancar-pedido-para-em-preparo.use-case';
import { AvancarPedidoParaProntoUseCase } from './application/use-cases/avancar-pedido-para-pronto.use-case';
import { BuscarPedidoPorIdUseCase } from './application/use-cases/buscar-pedido-por-id.use-case';
import { CancelarPedidoUseCase } from './application/use-cases/cancelar-pedido.use-case';
import { CriarPedidoUseCase } from './application/use-cases/criar-pedido.use-case';
import { ListarPedidosPorStatusUseCase } from './application/use-cases/listar-pedidos-por-status.use-case';
import { ListarPedidosUseCase } from './application/use-cases/listar-pedidos.use-case';
import { PEDIDO_REPOSITORY } from './domain/pedido.repository';
import { PrismaPedidoRepository } from './infrastructure/prisma-pedido.repository';

/**
 * Bounded Context Pedidos (Missão 0012) — o mais acoplado do domínio. Importa CatalogoModule
 * só para consumir `BuscarProdutoParaPedidoUseCase` (ADR-0022). Exporta só a Application
 * Service Interface — a partir da Missão 0013, inclui as transições que Cozinha consome
 * (`AvancarPedidoParaEmPreparoUseCase`, `AvancarPedidoParaProntoUseCase`,
 * `ListarPedidosPorStatusUseCase`), sempre mantendo a máquina de estados centralizada aqui.
 */
@Module({
  imports: [CatalogoModule],
  controllers: [PedidoController],
  providers: [
    CriarPedidoUseCase,
    BuscarPedidoPorIdUseCase,
    ListarPedidosUseCase,
    ListarPedidosPorStatusUseCase,
    CancelarPedidoUseCase,
    AvancarPedidoParaEmPreparoUseCase,
    AvancarPedidoParaProntoUseCase,
    { provide: PEDIDO_REPOSITORY, useClass: PrismaPedidoRepository },
  ],
  exports: [
    CriarPedidoUseCase,
    BuscarPedidoPorIdUseCase,
    ListarPedidosUseCase,
    ListarPedidosPorStatusUseCase,
    CancelarPedidoUseCase,
    AvancarPedidoParaEmPreparoUseCase,
    AvancarPedidoParaProntoUseCase,
  ],
})
export class PedidosModule {}
