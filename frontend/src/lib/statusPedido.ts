import { StatusPedido } from '../types';

export const ORDEM_STATUS: StatusPedido[] = [
  'recebido',
  'em_preparo',
  'pronto',
  'entregue',
  'finalizado',
];

/** Etapas visíveis pro cliente no acompanhamento — "finalizado" é controle interno do lojista. */
export const ORDEM_STATUS_CLIENTE: StatusPedido[] = [
  'recebido',
  'em_preparo',
  'pronto',
  'entregue',
];

export function rotuloStatus(
  status: StatusPedido,
  formaRecebimento: 'entrega' | 'retirada',
): string {
  switch (status) {
    case 'recebido':
      return 'Recebido';
    case 'em_preparo':
      return 'Em preparo';
    case 'pronto':
      return formaRecebimento === 'entrega' ? 'Em rota' : 'Pronto para retirada';
    case 'entregue':
      return formaRecebimento === 'entrega' ? 'Entregue' : 'Retirado';
    case 'finalizado':
      return 'Finalizado';
  }
}

/** Status seguinte no fluxo operacional — null quando não há próxima etapa (fim de linha). */
export function proximoStatus(status: StatusPedido): StatusPedido | null {
  switch (status) {
    case 'recebido':
      return 'em_preparo';
    case 'em_preparo':
      return 'pronto';
    case 'pronto':
      return 'entregue';
    case 'entregue':
      return 'finalizado';
    case 'finalizado':
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
    case 'em_preparo':
      return formaRecebimento === 'entrega' ? 'Saiu para entrega' : 'Pronto para retirada';
    case 'pronto':
      return formaRecebimento === 'entrega' ? 'Marcar como entregue' : 'Marcar como retirado';
    case 'entregue':
      return 'Arquivar pedido';
    case 'finalizado':
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
