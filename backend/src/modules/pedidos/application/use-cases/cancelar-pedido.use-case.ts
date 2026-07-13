import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PedidoJaFinalizadoError } from '../../domain/pedido.entity';
import { PEDIDO_REPOSITORY, PedidoRepository } from '../../domain/pedido.repository';

@Injectable()
export class CancelarPedidoUseCase {
  constructor(@Inject(PEDIDO_REPOSITORY) private readonly repositorio: PedidoRepository) {}

  async execute(pedidoId: string, chamadorEmpresaId: string) {
    const pedido = await this.repositorio.buscarPorId(pedidoId);
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (pedido.paraPersistencia().empresaId !== chamadorEmpresaId) {
      throw new ForbiddenException('Pedido não pertence à sua Empresa.');
    }

    try {
      pedido.cancelar();
    } catch (erro) {
      if (erro instanceof PedidoJaFinalizadoError) {
        throw new BadRequestException(erro.message);
      }
      throw erro;
    }

    await this.repositorio.salvar(pedido);

    return pedido.paraPersistencia();
  }
}
