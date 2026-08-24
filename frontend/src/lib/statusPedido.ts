import { StatusPedido } from '../types';

/**
 * Ordem canônica do fluxo operacional — usada tanto pelas colunas da Central
 * (desktop) quanto pelo stepper do cliente. "cancelado" fica fora dessa
 * sequência: é um desvio lateral, não uma etapa do fluxo principal (ver
 * `transicaoValida`).
 */
export const ORDEM_STATUS: StatusPedido[] = [
  'recebido',
  'confirmado',
  'em_preparo',
  'pronto',
  'entregue',
  'finalizado',
];

/** Etapas visíveis pro cliente no acompanhamento — "finalizado" é controle interno do lojista. */
export const ORDEM_STATUS_CLIENTE: StatusPedido[] = [
  'recebido',
  'confirmado',
  'em_preparo',
  'pronto',
  'entregue',
];

/**
 * Autoridade da UI sobre transições válidas — espelha
 * backend/src/utils/statusPedido.ts (autoridade real, revalidada na API).
 * Usado pra desabilitar visualmente alvos de drag/botão que a API rejeitaria.
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

export function transicaoValida(atual: StatusPedido, novo: StatusPedido): boolean {
  return PROXIMOS_VALIDOS[atual].includes(novo);
}

export function rotuloStatus(
  status: StatusPedido,
  formaRecebimento: 'entrega' | 'retirada',
): string {
  switch (status) {
    case 'recebido':
      return 'Recebido';
    case 'confirmado':
      return 'Confirmado';
    case 'em_preparo':
      return 'Em preparo';
    case 'pronto':
      return formaRecebimento === 'entrega' ? 'Saiu para entrega' : 'Pronto para retirada';
    case 'entregue':
      return formaRecebimento === 'entrega' ? 'Entregue' : 'Retirado';
    case 'finalizado':
      return 'Finalizado';
    case 'cancelado':
      return 'Cancelado';
  }
}

/** Título genérico de coluna na Central — cobre entrega e retirada ao mesmo tempo (o card mostra o tipo). */
export function rotuloColuna(status: StatusPedido): string {
  switch (status) {
    case 'recebido':
      return 'Recebido';
    case 'confirmado':
      return 'Confirmado';
    case 'em_preparo':
      return 'Em preparo';
    case 'pronto':
      return 'Pronto';
    case 'entregue':
      return 'Entregue';
    case 'finalizado':
      return 'Finalizado';
    case 'cancelado':
      return 'Cancelado';
  }
}

/** Status seguinte no fluxo operacional — null quando não há próxima etapa (fim de linha) ou o próximo é um desvio (cancelado). */
export function proximoStatus(status: StatusPedido): StatusPedido | null {
  switch (status) {
    case 'recebido':
      return 'confirmado';
    case 'confirmado':
      return 'em_preparo';
    case 'em_preparo':
      return 'pronto';
    case 'pronto':
      return 'entregue';
    case 'entregue':
      return 'finalizado';
    case 'finalizado':
    case 'cancelado':
      return null;
  }
}

/** Texto do botão de ação principal — a única ação em destaque na Central de Pedidos. */
export function rotuloProximaAcao(
  status: StatusPedido,
  formaRecebimento: 'entrega' | 'retirada',
): string | null {
  switch (status) {
    case 'recebido':
      return 'Aceitar pedido';
    case 'confirmado':
      return 'Iniciar preparo';
    case 'em_preparo':
      return formaRecebimento === 'entrega' ? 'Saiu para entrega' : 'Pronto para retirada';
    case 'pronto':
      return formaRecebimento === 'entrega' ? 'Marcar como entregue' : 'Marcar como retirado';
    case 'entregue':
      return 'Arquivar pedido';
    case 'finalizado':
    case 'cancelado':
      return null;
  }
}

/** Rótulo do card na Central de Pedidos — só "recebido" ganha destaque de "Novo pedido". */
export function tituloCardPedido(
  status: StatusPedido,
  formaRecebimento: 'entrega' | 'retirada',
): string {
  return status === 'recebido' ? 'Novo pedido' : rotuloStatus(status, formaRecebimento);
}
