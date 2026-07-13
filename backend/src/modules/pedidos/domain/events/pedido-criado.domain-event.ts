/** Missão 0004, Seção 6. Publicação real (Outbox, ADR-0023) fica a cargo do repositório. */
export class PedidoCriadoEvent {
  static readonly tipo = 'PEDIDO_CRIADO'; // particípio passado — ADR-0006

  constructor(
    public readonly pedidoId: string,
    public readonly empresaId: string,
    public readonly ocorridoEm: Date,
  ) {}
}
