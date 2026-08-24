export interface ResumoOperacionalInput {
  /** Já vem calculado pelo backend (calcularAberto) — nunca recalcular horário aqui. */
  aberto: boolean;
  pedidosPrecisandoAtencao: number;
}

export interface ResumoOperacional {
  icone: '🟢' | '🔴' | '🟠';
  mensagem: string;
}

/**
 * Linha curta abaixo da saudação no Dashboard. Pedidos aguardando aceite
 * (status "recebido") têm prioridade sobre o estado aberto/fechado — é a
 * informação mais acionável pro lojista no momento.
 */
export function resumoOperacional({
  aberto,
  pedidosPrecisandoAtencao,
}: ResumoOperacionalInput): ResumoOperacional {
  if (pedidosPrecisandoAtencao > 0) {
    return {
      icone: '🟠',
      mensagem: `${pedidosPrecisandoAtencao} ${
        pedidosPrecisandoAtencao === 1 ? 'pedido precisa' : 'pedidos precisam'
      } da sua atenção.`,
    };
  }

  if (aberto) {
    return {
      icone: '🟢',
      mensagem: 'Sua loja está aberta e recebendo pedidos. Tudo certo por aqui.',
    };
  }

  return {
    icone: '🔴',
    mensagem: 'Sua loja está fechada no momento.',
  };
}
