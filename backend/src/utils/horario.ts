interface LojaHorario {
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
  horariosFuncionamento?: HorariosFuncionamento | null;
}

// Todas as lojas hoje são brasileiras (WhatsApp, Pix, R$) — fuso fixo, sem
// horário de verão (abolido no Brasil desde 2019). Não dá pra usar
// Date.getHours() aqui: em produção o processo roda em UTC (Cloud
// Functions), então precisamos converter o instante pro fuso da loja em vez
// de confiar no fuso local do processo.
export const FUSO_LOJA = 'America/Fortaleza';
/** Offset fixo de FUSO_LOJA em relação ao UTC, em minutos (UTC-3 => -180). */
export const OFFSET_MINUTOS_FUSO_LOJA = -180;

/** "HH:mm" -> minutos desde 00:00 */
export function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosDoDiaNoFuso(data: Date, timeZone: string = FUSO_LOJA): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(data);
  const hora = Number(partes.find((p) => p.type === 'hour')?.value ?? 0);
  const minuto = Number(partes.find((p) => p.type === 'minute')?.value ?? 0);
  return hora * 60 + minuto;
}

const NOMES_DIA_SEMANA_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Dia da semana (0=domingo..6=sábado, igual Date.getDay()) no fuso da loja — nunca no fuso do processo. */
export function diaDaSemanaNoFuso(data: Date, timeZone: string = FUSO_LOJA): number {
  const nome = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(data);
  const indice = NOMES_DIA_SEMANA_EN.indexOf(nome);
  return indice === -1 ? 0 : indice;
}

/**
 * Janela legada: um único par abertura/fechamento vale todo dia da semana.
 * Extraído da lógica que já existia em `calcularAberto` — mesmo
 * comportamento, agora reutilizável também por `validarAgendamento`.
 */
function dentroDoHorarioSimples(
  horarioAbertura: string,
  horarioFechamento: string,
  minutosNoInstante: number,
): boolean {
  const abertura = paraMinutos(horarioAbertura);
  const fechamento = paraMinutos(horarioFechamento);

  if (abertura === fechamento) return true; // convenção existente: 24h

  if (abertura < fechamento) {
    return minutosNoInstante >= abertura && minutosNoInstante < fechamento;
  }

  // horário atravessa a meia-noite (ex: 18:00–02:00)
  return minutosNoInstante >= abertura || minutosNoInstante < fechamento;
}

// --- Agenda semanal ---

export interface FaixaHorarioDia {
  abertura: string; // "HH:mm"
  fechamento: string; // "HH:mm" — pode ser menor que abertura (atravessa meia-noite)
}

export interface DiaHorarioFuncionamento {
  diaSemana: number; // 0=domingo .. 6=sábado, igual Date.getDay()
  ativo: boolean;
  faixas: FaixaHorarioDia[];
}

export type HorariosFuncionamento = DiaHorarioFuncionamento[];

/**
 * A loja está aberta agora por causa da agenda semanal? Verifica dois dias:
 * o de hoje (faixas normais + a "parte de antes da meia-noite" de uma faixa
 * que atravessa o dia) e o de ontem (só a "parte depois da meia-noite" de
 * uma faixa de ontem que atravessou pra hoje de madrugada). É assim que uma
 * sexta 18:00–02:00 continua aberta à 01:00 de sábado mesmo que sábado
 * esteja marcado como fechado — o expediente pertence a sexta, não a sábado.
 */
export function dentroDoHorarioSemanal(
  horarios: HorariosFuncionamento,
  instante: Date,
  timeZone: string = FUSO_LOJA,
): boolean {
  const minutosAgora = minutosDoDiaNoFuso(instante, timeZone);
  const diaHoje = diaDaSemanaNoFuso(instante, timeZone);
  const diaOntem = (diaHoje + 6) % 7;

  const hoje = horarios.find((d) => d.diaSemana === diaHoje);
  if (hoje?.ativo) {
    for (const faixa of hoje.faixas) {
      const abertura = paraMinutos(faixa.abertura);
      const fechamento = paraMinutos(faixa.fechamento);
      if (abertura < fechamento) {
        if (minutosAgora >= abertura && minutosAgora < fechamento) return true;
      } else {
        // atravessa meia-noite — a parte de hoje é só a partir da abertura;
        // a parte depois da meia-noite é resolvida abaixo, olhando "ontem".
        if (minutosAgora >= abertura) return true;
      }
    }
  }

  const ontem = horarios.find((d) => d.diaSemana === diaOntem);
  if (ontem?.ativo) {
    for (const faixa of ontem.faixas) {
      const abertura = paraMinutos(faixa.abertura);
      const fechamento = paraMinutos(faixa.fechamento);
      if (fechamento <= abertura && minutosAgora < fechamento) return true;
    }
  }

  return false;
}

export function calcularAberto(loja: LojaHorario, agora: Date = new Date()): boolean {
  if (loja.abertoManual !== null && loja.abertoManual !== undefined) {
    return loja.abertoManual;
  }

  if (loja.horariosFuncionamento) {
    return dentroDoHorarioSemanal(loja.horariosFuncionamento, agora);
  }

  if (!loja.horarioAbertura || !loja.horarioFechamento) {
    return true;
  }

  return dentroDoHorarioSimples(
    loja.horarioAbertura,
    loja.horarioFechamento,
    minutosDoDiaNoFuso(agora, FUSO_LOJA),
  );
}

/** Usado por `validarAgendamento` — mesma checagem de "está dentro do horário", mas pra um instante futuro (não olha abertoManual, que é só pro "agora"). */
export function dentroDoHorarioNoInstante(loja: LojaHorario, instante: Date): boolean {
  if (loja.horariosFuncionamento) {
    return dentroDoHorarioSemanal(loja.horariosFuncionamento, instante);
  }
  if (!loja.horarioAbertura || !loja.horarioFechamento) return true;
  return dentroDoHorarioSimples(
    loja.horarioAbertura,
    loja.horarioFechamento,
    minutosDoDiaNoFuso(instante, FUSO_LOJA),
  );
}

// --- Validação da agenda semanal enviada pelo lojista ---

export interface ResultadoValidacaoHorarios {
  valido: boolean;
  erro?: string;
}

const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

function faixasSobrepostas(faixas: FaixaHorarioDia[]): boolean {
  // Normaliza cada faixa numa janela [inicio, fim) no eixo de minutos do dia,
  // estendendo pra além de 1440 quando atravessa meia-noite — suficiente pra
  // detectar sobreposição dentro do MESMO dia, sem tentar modelar o
  // calendário inteiro (isso é feito em dentroDoHorarioSemanal).
  const normalizadas = faixas
    .map((f) => {
      const inicio = paraMinutos(f.abertura);
      const fimBruto = paraMinutos(f.fechamento);
      const fim = fimBruto <= inicio ? fimBruto + 1440 : fimBruto;
      return { inicio, fim };
    })
    .sort((a, b) => a.inicio - b.inicio);

  for (let i = 1; i < normalizadas.length; i += 1) {
    if (normalizadas[i].inicio < normalizadas[i - 1].fim) return true;
  }
  return false;
}

/**
 * Regras de negócio da agenda semanal (formato/tipos já garantidos pelo zod
 * na rota — ver `admin.ts`): precisa cobrir os 7 dias, um de cada; dia ativo
 * exige pelo menos uma faixa e dia inativo não pode ter faixa nenhuma;
 * horários "HH:mm" válidos; sem faixas sobrepostas no mesmo dia.
 */
export function validarHorariosFuncionamento(
  horarios: HorariosFuncionamento,
): ResultadoValidacaoHorarios {
  if (horarios.length !== 7) {
    return { valido: false, erro: 'A agenda semanal precisa ter os 7 dias da semana' };
  }

  const diasVistos = new Set<number>();
  for (const dia of horarios) {
    if (!Number.isInteger(dia.diaSemana) || dia.diaSemana < 0 || dia.diaSemana > 6) {
      return { valido: false, erro: 'Dia da semana inválido' };
    }
    if (diasVistos.has(dia.diaSemana)) {
      return { valido: false, erro: 'Dia da semana duplicado na agenda' };
    }
    diasVistos.add(dia.diaSemana);

    if (!dia.ativo) {
      if (dia.faixas.length > 0) {
        return { valido: false, erro: 'Dia marcado como fechado não pode ter horário cadastrado' };
      }
      continue;
    }

    if (dia.faixas.length === 0) {
      return { valido: false, erro: 'Dia marcado como aberto precisa de pelo menos um horário' };
    }

    for (const faixa of dia.faixas) {
      if (!REGEX_HORA.test(faixa.abertura) || !REGEX_HORA.test(faixa.fechamento)) {
        return { valido: false, erro: 'Horário inválido — use o formato HH:mm' };
      }
      if (faixa.abertura === faixa.fechamento) {
        return { valido: false, erro: 'Abertura e fechamento não podem ser iguais' };
      }
    }

    if (faixasSobrepostas(dia.faixas)) {
      return { valido: false, erro: 'Horários sobrepostos no mesmo dia' };
    }
  }

  if (diasVistos.size !== 7) {
    return { valido: false, erro: 'A agenda semanal precisa cobrir os 7 dias, um de cada' };
  }

  return { valido: true };
}
