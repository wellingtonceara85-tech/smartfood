import { Inject, Injectable } from '@nestjs/common';
import { PEDIDO_REPOSITORY, PedidoRepository } from '../../domain/pedido.repository';

@Injectable()
export class ListarPedidosUseCase {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly repositorio: PedidoRepository) {}

  async execute(empresaId: string) {
    const pedidos = await this.repositorio.listarPorEmpresa(empresaId);
    return pedidos.map((p) => p.paraPersistencia());
  }
}
