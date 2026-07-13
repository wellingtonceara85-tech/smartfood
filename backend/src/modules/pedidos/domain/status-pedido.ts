/**
 * Ciclo de vida completo (Missão 0004, Seção 7). Cada missão implementa suas próprias
 * transições: Missão 0012 (criação nasce em AGUARDANDO_PAGAMENTO, e (qualquer estado
 * pré-Concluído)→CANCELADO), Missão 0013 (RECEBIDO→EM_PREPARO→PRONTO). PRONTO e
 * SAIU_PARA_ENTREGA são estados distintos (ADR-0025) — correção de ambiguidade de notação
 * entre a Missão 0004 e a Missão 0002, não mudança de regra de negócio.
 */
export enum StatusPedido {
  CRIADO = 'CRIADO',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
  PAGAMENTO_RECUSADO = 'PAGAMENTO_RECUSADO',
  RECEBIDO = 'RECEBIDO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  SAIU_PARA_ENTREGA = 'SAIU_PARA_ENTREGA',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

/** Concluído e Cancelado nunca transitam para nenhum outro estado, nem entre si (Missão 0012, Seção 2). */
const ESTADOS_TERMINAIS: readonly StatusPedido[] = [StatusPedido.CONCLUIDO, StatusPedido.CANCELADO];

export function ehEstadoTerminal(status: StatusPedido): boolean {
  return (ESTADOS_TERMINAIS as StatusPedido[]).includes(status);
}
