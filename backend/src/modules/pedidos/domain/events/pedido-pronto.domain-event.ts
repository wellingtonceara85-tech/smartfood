/** Missão 0013 (Cozinha). Transição Em Preparo → Pronto. */
export class PedidoProntoEvent {
  static readonly tipo = 'PEDIDO_PRONTO'; // particípio passado — ADR-0006

  constructor(
    public readonly pedidoId: string,
    public readonly empresaId: string,
    public readonly ocorridoEm: Date,
  ) {}
}
