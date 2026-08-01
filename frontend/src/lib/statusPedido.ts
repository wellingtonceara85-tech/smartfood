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
