import { Pedido } from './pedido.entity';
import { StatusPedido } from './status-pedido';

export interface PedidoRepository {
  salvar(pedido: Pedido): Promise<void>;
  buscarPorId(id: string): Promise<Pedido | null>;
  listarPorEmpresa(empresaId: string): Promise<Pedido[]>;
  /** Missão 0013 — fila da Cozinha (`Recebido`+`Em Preparo`), mas genérico para qualquer filtro futuro. */
  listarPorEmpresaEStatus(empresaId: string, status: StatusPedido[]): Promise<Pedido[]>;
}

export const PEDIDO_REPOSITORY = Symbol('PedidoRepository');
