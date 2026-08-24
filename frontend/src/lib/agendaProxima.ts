import { PedidoAdmin } from '../types';

export type ProximidadeAgendamento = 'atrasado' | 'proximo' | 'distante';

/**
 * Limiar de "atenção" pra pedido agendado se aproximando — não há regra
 * equivalente em nenhum outro lugar do projeto (ver auditoria da missão
 * Dashboard/Notificações). Único ponto de verdade: mudar aqui muda em toda
 * a Central e nos Próximos Pedidos.
 */
export const LIMIAR_PROXIMIDADE_MINUTOS = 60;

/**
 * Classifica um horário agendado em relação a agora: já passou (atrasado),
 * dentro do limiar de atenção (proximo) ou ainda distante.
 */
export function proximidadeAgendamento(
  dataAgendamentoISO: string,
  agora: Date = new Date(),
): ProximidadeAgendamento {
  const minutosRestantes = (new Date(dataAgendamentoISO).getTime() - agora.getTime()) / 60_000;
  if (minutosRestantes < 0) return 'atrasado';
  if (minutosRestantes <= LIMIAR_PROXIMIDADE_MINUTOS) return 'proximo';
  return 'distante';
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** "Hoje às 18:30" / "Amanhã às 10:00" / "27/08 às 15:00" — deriva sempre da data real, nunca de comparação textual. */
export function formatarAgendamentoCurto(
  dataAgendamentoISO: string,
  agora: Date = new Date(),
): string {
  const data = new Date(dataAgendamentoISO);
  const diffDias = Math.round(
    (inicioDoDia(data).getTime() - inicioDoDia(agora).getTime()) / 86_400_000,
  );
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (diffDias === 0) return `Hoje às ${hora}`;
  if (diffDias === 1) return `Amanhã às ${hora}`;

  const dataCurta = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dataCurta} às ${hora}`;
}

/**
 * Prioridade operacional de um pedido pra a seção "Próximos pedidos" do
 * Dashboard — quanto menor, mais no topo. Agendamentos atrasados vêm
 * primeiro (crítico), depois pedidos aguardando aceite/em preparo, depois
 * agendamentos se aproximando, depois o resto do fluxo ativo.
 */
function prioridadePedido(pedido: PedidoAdmin, agora: Date): number {
  if (pedido.status === 'entregue' || pedido.status === 'finalizado') return 99;

  if (pedido.tipoPedido === 'agendado' && pedido.dataAgendamento) {
    const proximidade = proximidadeAgendamento(pedido.dataAgendamento, agora);
    if (proximidade === 'atrasado') return 0;
    if (proximidade === 'proximo') return 2;
    // Agendamento ainda distante: só sobe no meio do fluxo ativo se já está em preparo.
    return pedido.status === 'em_preparo' ? 4 : 5;
  }

  if (pedido.status === 'recebido') return 1;
  if (pedido.status === 'em_preparo') return 1;
  if (pedido.status === 'pronto') return 3;
  return 5;
}

/**
 * Pedidos que precisam de atenção agora, ordenados por urgência operacional.
 * Exclui pedidos já concluídos (entregue/finalizado) — esses não aparecem
 * na seção "Próximos pedidos".
 */
export function ordenarProximosPedidos(
  pedidos: PedidoAdmin[],
  agora: Date = new Date(),
): PedidoAdmin[] {
  return pedidos
    .filter((p) => p.status !== 'entregue' && p.status !== 'finalizado')
    .map((pedido) => ({ pedido, prioridade: prioridadePedido(pedido, agora) }))
    .sort((a, b) => {
      if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
      const dataA = new Date(
        a.pedido.tipoPedido === 'agendado' && a.pedido.dataAgendamento
          ? a.pedido.dataAgendamento
          : a.pedido.criadoEm,
      ).getTime();
      const dataB = new Date(
        b.pedido.tipoPedido === 'agendado' && b.pedido.dataAgendamento
          ? b.pedido.dataAgendamento
          : b.pedido.criadoEm,
      ).getTime();
      return dataA - dataB;
    })
    .map((item) => item.pedido);
}

/** Quantos pedidos aguardam aceite ("recebido") — usado no resumo operacional do Dashboard. */
export function contarPedidosPrecisandoAtencao(pedidos: PedidoAdmin[]): number {
  return pedidos.filter((p) => p.status === 'recebido').length;
}
