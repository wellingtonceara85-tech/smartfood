/**
 * Missão 0004, Seção 6. Não existe `PEDIDO_CONFIRMADO` — só `PEDIDO_CRIADO` e `PEDIDO_CANCELADO`
 * estão de fato congelados nesta missão (Missão 0012, Seção 2 — correção feita na revisão).
 */
export class PedidoCanceladoEvent {
  static readonly tipo = 'PEDIDO_CANCELADO'; // particípio passado — ADR-0006

  constructor(
    public readonly pedidoId: string,
    public readonly empresaId: string,
    public readonly ocorridoEm: Date,
  ) {}
}
