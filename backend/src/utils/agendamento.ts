import {
  dentroDoHorarioNoInstante,
  FUSO_LOJA,
  HorariosFuncionamento,
  OFFSET_MINUTOS_FUSO_LOJA,
} from './horario';

interface LojaAgendamento {
  aceitaAgendamento: boolean;
  antecedenciaMinimaMinutos: number;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  horariosFuncionamento?: HorariosFuncionamento | null;
}

/**
 * Combina uma data ("YYYY-MM-DD") e hora ("HH:mm") escolhidas pelo cliente —
 * sempre interpretadas como horário de parede no fuso da loja (FUSO_LOJA),
 * nunca no fuso do navegador do cliente — num instante UTC real pra gravar
 * no banco. Retorna null se o formato for inválido.
 */
export function combinarDataHoraLocalParaUtc(dataISO: string, horaHHmm: string): Date | null {
  const dataMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO);
  const horaMatch = /^(\d{2}):(\d{2})$/.exec(horaHHmm);
  if (!dataMatch || !horaMatch) return null;

  const [, ano, mes, dia] = dataMatch;
  const [, hora, minuto] = horaMatch;
  const comoSeFosseUtc = Date.UTC(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
  );
  if (Number.isNaN(comoSeFosseUtc)) return null;

  // local = UTC + OFFSET (offset negativo) => UTC = local - OFFSET
  return new Date(comoSeFosseUtc - OFFSET_MINUTOS_FUSO_LOJA * 60_000);
}

/** "30/08/2026 às 17:00", sempre no fuso da loja — usado na mensagem de WhatsApp montada no servidor. */
export function formatarDataHoraLocal(data: Date): string {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_LOJA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('day')}/${valor('month')}/${valor('year')} às ${valor('hour')}:${valor('minute')}`;
}

/** "48 horas" / "30 minutos" / "3 dias" — pra mensagem amigável no checkout. */
export function formatarAntecedencia(minutos: number): string {
  if (minutos <= 0) return '0 minutos';
  if (minutos % 1440 === 0) {
    const dias = minutos / 1440;
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  if (minutos % 60 === 0) {
    const horas = minutos / 60;
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }
  return `${minutos} minutos`;
}

export interface ResultadoValidacaoAgendamento {
  valido: boolean;
  erro?: string;
}

/**
 * Validação de servidor pro pedido agendado — nunca confiar só na validação
 * visual do checkout. Verifica: loja aceita agendamento, data no futuro,
 * antecedência mínima configurada e (quando a loja tem horário cadastrado)
 * se o horário escolhido cai dentro do funcionamento.
 */
export function validarAgendamento(
  loja: LojaAgendamento,
  dataAgendamentoUtc: Date,
  agora: Date = new Date(),
): ResultadoValidacaoAgendamento {
  if (!loja.aceitaAgendamento) {
    return { valido: false, erro: 'Esta loja não aceita pedidos agendados' };
  }

  if (dataAgendamentoUtc.getTime() <= agora.getTime()) {
    return { valido: false, erro: 'A data e horário do agendamento devem ser no futuro' };
  }

  const antecedenciaMinutos = (dataAgendamentoUtc.getTime() - agora.getTime()) / 60_000;
  if (antecedenciaMinutos < loja.antecedenciaMinimaMinutos) {
    return {
      valido: false,
      erro: `Esta loja recebe encomendas com pelo menos ${formatarAntecedencia(loja.antecedenciaMinimaMinutos)} de antecedência.`,
    };
  }

  // Mesma checagem que decide "está aberto agora" (calcularAberto), mas
  // aplicada ao instante futuro escolhido — nunca olha abertoManual, que é
  // um override só do "agora" e não faz sentido pra uma data futura.
  if (loja.horariosFuncionamento || (loja.horarioAbertura && loja.horarioFechamento)) {
    const dentroDoHorario = dentroDoHorarioNoInstante(
      { ...loja, abertoManual: null },
      dataAgendamentoUtc,
    );

    if (!dentroDoHorario) {
      const erro = loja.horariosFuncionamento
        ? 'Escolha um horário dentro do funcionamento da loja nesse dia da semana.'
        : `Escolha um horário entre ${loja.horarioAbertura} e ${loja.horarioFechamento}, que é quando a loja funciona.`;
      return { valido: false, erro };
    }
  }

  return { valido: true };
}
