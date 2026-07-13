import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PEDIDO_REPOSITORY, PedidoRepository } from '../../domain/pedido.repository';

@Injectable()
export class BuscarPedidoPorIdUseCase {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly repositorio: PedidoRepository) {}

  async execute(pedidoId: string, chamadorEmpresaId: string) {
    const pedido = await this.repositorio.buscarPorId(pedidoId);
    if (!pedido) {
      return null;
    }
    if (pedido.paraPersistencia().empresaId !== chamadorEmpresaId) {
      throw new ForbiddenException('Pedido não pertence à sua Empresa.');
    }
    return pedido.paraPersistencia();
  }
}
