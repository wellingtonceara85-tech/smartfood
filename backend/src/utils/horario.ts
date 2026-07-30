interface LojaHorario {
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
}

/** "HH:mm" -> minutos desde 00:00 */
function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function calcularAberto(loja: LojaHorario, agora: Date = new Date()): boolean {
  if (loja.abertoManual !== null && loja.abertoManual !== undefined) {
    return loja.abertoManual;
  }

  if (!loja.horarioAbertura || !loja.horarioFechamento) {
    return true;
  }

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const abertura = paraMinutos(loja.horarioAbertura);
  const fechamento = paraMinutos(loja.horarioFechamento);

  if (abertura === fechamento) return true;

  if (abertura < fechamento) {
    return minutosAgora >= abertura && minutosAgora < fechamento;
  }

  // horário atravessa a meia-noite (ex: 18:00–02:00)
  return minutosAgora >= abertura || minutosAgora < fechamento;
}
