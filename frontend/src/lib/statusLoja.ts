export type EstadoOperacionalLoja =
  'auto_aberto' | 'auto_fechado' | 'manual_aberto' | 'manual_fechado';

export interface AcaoStatusLoja {
  rotulo: string;
  tipo: 'ver_loja' | 'ver_horarios';
}

export interface StatusOperacionalLoja {
  estado: EstadoOperacionalLoja;
  icone: '🟢' | '🔴' | '🟠';
  titulo: string;
  descricao: string;
  /**
   * Ações do card, na ordem em que devem aparecer. "Ver loja" está sempre
   * presente — o lojista precisa conseguir abrir o próprio cardápio público
   * independente do estado atual. Estados fechados (auto/manual) também
   * trazem "Ver horários" antes, pra resolver a causa do fechamento.
   */
  acoes: AcaoStatusLoja[];
}

interface LojaStatusInput {
  aberto: boolean;
  abertoManual: boolean | null;
}

const VER_LOJA: AcaoStatusLoja = { rotulo: 'Ver loja →', tipo: 'ver_loja' };
const VER_HORARIOS: AcaoStatusLoja = { rotulo: 'Ver horários →', tipo: 'ver_horarios' };

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
      acoes: [VER_LOJA],
    };
  }

  if (manual && !aberto) {
    return {
      estado: 'manual_fechado',
      icone: '🟠',
      titulo: 'Loja fechada manualmente',
      descricao: 'Horário automático pausado',
      acoes: [VER_HORARIOS, VER_LOJA],
    };
  }

  if (aberto) {
    return {
      estado: 'auto_aberto',
      icone: '🟢',
      titulo: 'Loja aberta',
      descricao: 'Recebendo pedidos',
      acoes: [VER_LOJA],
    };
  }

  return {
    estado: 'auto_fechado',
    icone: '🔴',
    titulo: 'Loja fechada',
    descricao: 'Fora do horário de funcionamento',
    acoes: [VER_HORARIOS, VER_LOJA],
  };
}
