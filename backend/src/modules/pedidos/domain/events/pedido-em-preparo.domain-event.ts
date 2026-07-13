/** Missão 0013 (Cozinha). Transição Recebido → Em Preparo. */
export class PedidoEmPreparoEvent {
  static readonly tipo = 'PEDIDO_EM_PREPARO'; // particípio passado — ADR-0006

  constructor(
    public readonly pedidoId: string,
    public readonly empresaId: string,
    public readonly ocorridoEm: Date,
  ) {}
}
