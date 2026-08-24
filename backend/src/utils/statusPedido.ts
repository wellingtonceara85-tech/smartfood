export const STATUS_PEDIDO = [
  'recebido',
  'confirmado',
  'em_preparo',
  'pronto',
  'entregue',
  'finalizado',
  'cancelado',
] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

/**
 * Autoridade das transições de status — espelhada em
 * frontend/src/lib/statusPedido.ts só para desabilitar visualmente alvos
 * inválidos (drag/botões). O backend nunca confia no frontend: toda mudança
 * de status passa por `transicaoValida` antes de gravar.
 *
 * Fluxo linear único (mesmo para entrega/retirada — só o rótulo muda, ver
 * frontend). "cancelado" é alcançável até "pronto"; depois disso o pedido já
 * saiu/foi retirado e cancelar não faz mais sentido operacional.
 */
const PROXIMOS_VALIDOS: Record<StatusPedido, StatusPedido[]> = {
  recebido: ['confirmado', 'cancelado'],
  confirmado: ['em_preparo', 'cancelado'],
  em_preparo: ['pronto', 'cancelado'],
  pronto: ['entregue', 'cancelado'],
  entregue: ['finalizado'],
  finalizado: [],
  cancelado: [],
};

export function transicaoValida(atual: string, novo: string): boolean {
  if (!STATUS_PEDIDO.includes(novo as StatusPedido)) return false;
  const validos = PROXIMOS_VALIDOS[atual as StatusPedido];
  return validos ? validos.includes(novo as StatusPedido) : false;
}

/** Status a partir dos quais um cancelamento ainda é operacionalmente permitido. */
export function cancelamentoPermitido(atual: string): boolean {
  return transicaoValida(atual, 'cancelado');
}
