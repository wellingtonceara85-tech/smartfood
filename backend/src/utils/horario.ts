interface LojaHorario {
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
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

export function calcularAberto(loja: LojaHorario, agora: Date = new Date()): boolean {
  if (loja.abertoManual !== null && loja.abertoManual !== undefined) {
    return loja.abertoManual;
  }

  if (!loja.horarioAbertura || !loja.horarioFechamento) {
    return true;
  }

  const minutosAgora = minutosDoDiaNoFuso(agora, FUSO_LOJA);
  const abertura = paraMinutos(loja.horarioAbertura);
  const fechamento = paraMinutos(loja.horarioFechamento);

  if (abertura === fechamento) return true;

  if (abertura < fechamento) {
    return minutosAgora >= abertura && minutosAgora < fechamento;
  }

  // horário atravessa a meia-noite (ex: 18:00–02:00)
  return minutosAgora >= abertura || minutosAgora < fechamento;
}
