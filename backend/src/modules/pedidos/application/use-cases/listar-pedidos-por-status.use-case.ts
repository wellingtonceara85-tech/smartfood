import { Inject, Injectable } from '@nestjs/common';
import { PEDIDO_REPOSITORY, PedidoRepository } from '../../domain/pedido.repository';
import { StatusPedido } from '../../domain/status-pedido';

/**
 * `status` é `string[]` na fronteira pública (não o enum de domínio) — mantém a Application
 * Service Interface consumível por outro módulo (Cozinha, Missão 0013) sem exigir import de
 * `domain/status-pedido` de outro Bounded Context (ADR-0022). Conversão/validação para o enum
 * fica interna a este Use Case.
 */
@Injectable()
export class ListarPedidosPorStatusUseCase {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly repositorio: PedidoRepository) {}

  async execute(empresaId: string, status: string[]) {
    const pedidos = await this.repositorio.listarPorEmpresaEStatus(
      empresaId,
      status as StatusPedido[],
    );
    return pedidos.map((p) => p.paraPersistencia());
  }
}
