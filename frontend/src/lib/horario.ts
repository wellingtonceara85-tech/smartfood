export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export interface HorarioLoja {
  aberto: boolean;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
}

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * A loja só tem um horário diário (igual todo dia da semana) — não existe
 * cadastro por dia. A lista repete o mesmo horário pros 7 dias em vez de
 * inventar uma diferença que não existe no cadastro.
 */
export function listaDiasHorario(
  horarioAbertura: string | null,
  horarioFechamento: string | null,
): { dia: string; horario: string }[] {
  const horario =
    horarioAbertura && horarioFechamento
      ? `${horarioAbertura} às ${horarioFechamento}`
      : 'Horário não informado';
  return DIAS_SEMANA.map((dia) => ({ dia, horario }));
}

/** "Fecha hoje às 23:00" / "Abre amanhã às 18:00" — null quando não há horário cadastrado ou a loja é 24h. */
export function mensagemStatusLoja(loja: HorarioLoja, agora: Date = new Date()): string | null {
  if (!loja.horarioAbertura || !loja.horarioFechamento) return null;

  const abertura = paraMinutos(loja.horarioAbertura);
  const fechamento = paraMinutos(loja.horarioFechamento);
  if (abertura === fechamento) return null;

  if (loja.aberto) {
    return `Fecha hoje às ${loja.horarioFechamento}`;
  }

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  if (abertura < fechamento && minutosAgora >= fechamento) {
    return `Abre amanhã às ${loja.horarioAbertura}`;
  }
  return `Abre hoje às ${loja.horarioAbertura}`;
}
