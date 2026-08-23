export type EstadoOperacionalLoja =
  'auto_aberto' | 'auto_fechado' | 'manual_aberto' | 'manual_fechado';

export interface StatusOperacionalLoja {
  estado: EstadoOperacionalLoja;
  icone: '🟢' | '🔴' | '🟠';
  titulo: string;
  descricao: string;
  /** Rótulo + destino do link contextual do card ("Ver loja" ou "Ver horários"). */
  acao: { rotulo: string; tipo: 'ver_loja' | 'ver_horarios' };
}

interface LojaStatusInput {
  aberto: boolean;
  abertoManual: boolean | null;
}

/**
 * Card de status do painel (sidebar/dashboard) — reaproveita o campo `aberto`
 * já computado pelo backend a partir de `calcularAberto` (backend/src/utils/horario.ts),
 * nunca recalcula a regra de horário aqui. Só decide QUAL dos 4 estados
 * mostrar, cruzando `aberto` com `abertoManual`.
 */
export function statusOperacionalLoja({
  aberto,
  abertoManual,
}: LojaStatusInput): StatusOperacionalLoja {
  const manual = abertoManual !== null && abertoManual !== undefined;

  if (manual && aberto) {
    return {
      estado: 'manual_aberto',
      icone: '🟢',
      titulo: 'Loja aberta manualmente',
      descricao: 'Horário automático pausado',
      acao: { rotulo: 'Ver loja →', tipo: 'ver_loja' },
    };
  }

  if (manual && !aberto) {
    return {
      estado: 'manual_fechado',
      icone: '🟠',
      titulo: 'Loja fechada manualmente',
      descricao: 'Horário automático pausado',
      acao: { rotulo: 'Ver horários →', tipo: 'ver_horarios' },
    };
  }

  if (aberto) {
    return {
      estado: 'auto_aberto',
      icone: '🟢',
      titulo: 'Loja aberta',
      descricao: 'Recebendo pedidos',
      acao: { rotulo: 'Ver loja →', tipo: 'ver_loja' },
    };
  }

  return {
    estado: 'auto_fechado',
    icone: '🔴',
    titulo: 'Loja fechada',
    descricao: 'Fora do horário de funcionamento',
    acao: { rotulo: 'Ver horários →', tipo: 'ver_horarios' },
  };
}
