import { proximidadeAgendamento } from './agendaProxima';
import { PedidoAdmin } from '../types';

/** Mesmo intervalo já usado em produção pelo polling de Pedidos — único ponto de verdade agora. */
export const INTERVALO_POLLING_PEDIDOS_MS = 12_000;

/** Teto de notificações mantidas na Central — sessão longa não deve crescer sem limite. */
export const MAX_NOTIFICACOES = 20;

/** Quanto tempo um pedido novo fica com o destaque visual (ring) no card. */
export const DESTAQUE_PEDIDO_NOVO_MS = 10_000;

export type TipoNotificacao = 'novo_pedido' | 'agendamento_proximo';

export interface NotificacaoPainel {
  id: string;
  tipo: TipoNotificacao;
  pedidoId: string;
  numero: number;
  total: number;
  dataAgendamento: string | null;
  criadoEm: number;
  lida: boolean;
}

/**
 * Pedidos cujo id não estava no conjunto conhecido na leitura anterior.
 * `idsConhecidos === null` significa "primeira carga" — nesse caso nenhum
 * pedido é considerado novo (evita notificar tudo que já existia quando o
 * painel foi aberto).
 */
export function detectarPedidosNovos(
  pedidosAtuais: PedidoAdmin[],
  idsConhecidos: Set<string> | null,
): PedidoAdmin[] {
  if (!idsConhecidos) return [];
  return pedidosAtuais.filter((p) => !idsConhecidos.has(p.id));
}

/**
 * Pedidos agendados que entraram na janela de proximidade (ou já estão
 * atrasados) e ainda não geraram notificação. `idsJaNotificados` deve ser
 * atualizado pelo chamador com os ids retornados, pra nunca notificar o
 * mesmo pedido duas vezes na mesma sessão.
 */
export function detectarAgendamentosProximos(
  pedidos: PedidoAdmin[],
  idsJaNotificados: Set<string>,
  agora: Date = new Date(),
): PedidoAdmin[] {
  return pedidos.filter((pedido) => {
    if (pedido.tipoPedido !== 'agendado' || !pedido.dataAgendamento) return false;
    if (
      pedido.status === 'entregue' ||
      pedido.status === 'finalizado' ||
      pedido.status === 'cancelado'
    ) {
      return false;
    }
    if (idsJaNotificados.has(pedido.id)) return false;

    const proximidade = proximidadeAgendamento(pedido.dataAgendamento, agora);
    return proximidade === 'proximo' || proximidade === 'atrasado';
  });
}

export function criarNotificacaoNovoPedido(
  pedido: PedidoAdmin,
  criadoEm: number = Date.now(),
): NotificacaoPainel {
  return {
    id: `novo_pedido-${pedido.id}`,
    tipo: 'novo_pedido',
    pedidoId: pedido.id,
    numero: pedido.numero,
    total: pedido.total,
    dataAgendamento: pedido.dataAgendamento,
    criadoEm,
    lida: false,
  };
}

export function criarNotificacaoAgendamentoProximo(
  pedido: PedidoAdmin,
  criadoEm: number = Date.now(),
): NotificacaoPainel {
  return {
    id: `agendamento_proximo-${pedido.id}`,
    tipo: 'agendamento_proximo',
    pedidoId: pedido.id,
    numero: pedido.numero,
    total: pedido.total,
    dataAgendamento: pedido.dataAgendamento,
    criadoEm,
    lida: false,
  };
}

/** Insere notificações novas no topo da lista existente, sem duplicar por id e respeitando o teto MAX_NOTIFICACOES. */
export function adicionarNotificacoes(
  atuais: NotificacaoPainel[],
  novas: NotificacaoPainel[],
): NotificacaoPainel[] {
  if (novas.length === 0) return atuais;
  const idsExistentes = new Set(atuais.map((n) => n.id));
  const semDuplicata = novas.filter((n) => !idsExistentes.has(n.id));
  return [...semDuplicata, ...atuais].slice(0, MAX_NOTIFICACOES);
}

export function contarNaoLidas(notificacoes: NotificacaoPainel[]): number {
  return notificacoes.filter((n) => !n.lida).length;
}

export function marcarTodasComoLidas(notificacoes: NotificacaoPainel[]): NotificacaoPainel[] {
  return notificacoes.map((n) => (n.lida ? n : { ...n, lida: true }));
}

/**
 * Pedidos que ainda sustentam o alerta sonoro persistente — "aguardando
 * aceite" (status "recebido"), independente de terem acabado de chegar ou
 * já estarem há um tempo parados aí. Sai da lista assim que o lojista
 * confirma o pedido (ou cancela/pula pra qualquer outro status), o que
 * automaticamente encerra a pendência sonora correspondente — não precisa de
 * bookkeeping separado, é estado derivado de `pedidos`.
 */
export function pedidosPendentesAlerta(pedidos: PedidoAdmin[]): PedidoAdmin[] {
  return pedidos.filter((p) => p.status === 'recebido');
}
