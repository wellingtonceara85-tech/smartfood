import { DiaHorarioFuncionamento, FaixaHorarioDia, HorariosFuncionamento } from '../types';

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
  horariosFuncionamento?: HorariosFuncionamento | null;
}

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function minutosAgora(agora: Date): number {
  return agora.getHours() * 60 + agora.getMinutes();
}

/**
 * Uma nova loja (ou uma que nunca configurou horário) hoje aparece "sempre
 * aberta" — esse é o default que preserva esse comportamento ao popular o
 * editor semanal pela primeira vez, sem forçar o lojista a preencher nada
 * antes de poder salvar qualquer outra coisa na tela.
 */
export const FAIXA_SEMPRE_ABERTO: FaixaHorarioDia = { abertura: '00:00', fechamento: '23:59' };

/**
 * Estado inicial do editor semanal a partir do que a loja já tinha
 * (horarioAbertura/horarioFechamento legados). Nunca é gravado sozinho — só
 * quando o lojista salva a tela "Minha loja" com o editor já preenchido é
 * que a agenda semanal passa a existir de verdade pra essa loja.
 */
export function agendaInicialAPartirDoLegado(
  horarioAbertura: string | null,
  horarioFechamento: string | null,
): HorariosFuncionamento {
  const faixa: FaixaHorarioDia =
    horarioAbertura && horarioFechamento && horarioAbertura !== horarioFechamento
      ? { abertura: horarioAbertura, fechamento: horarioFechamento }
      : FAIXA_SEMPRE_ABERTO;

  return Array.from({ length: 7 }, (_, diaSemana) => ({
    diaSemana,
    ativo: true,
    faixas: [faixa],
  }));
}

function diaVazio(diaSemana: number): DiaHorarioFuncionamento {
  return { diaSemana, ativo: false, faixas: [] };
}

/** Agenda em branco (todo dia fechado) — ponto de partida quando não há nada pra herdar do legado. */
export function novaAgendaVazia(): HorariosFuncionamento {
  return Array.from({ length: 7 }, (_, diaSemana) => diaVazio(diaSemana));
}

/** "Segunda-feira: 11:00 às 14:00 · 18:00 às 23:00" / "Fechado" — usado no popover de horário do cardápio público. */
export function listaDiasHorario(loja: {
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  horariosFuncionamento?: HorariosFuncionamento | null;
}): { dia: string; horario: string }[] {
  if (loja.horariosFuncionamento) {
    const porDia = new Map(loja.horariosFuncionamento.map((d) => [d.diaSemana, d]));
    return DIAS_SEMANA.map((dia, diaSemana) => {
      const config = porDia.get(diaSemana);
      const horario =
        !config?.ativo || config.faixas.length === 0
          ? 'Fechado'
          : config.faixas.map((f) => `${f.abertura} às ${f.fechamento}`).join(' · ');
      return { dia, horario };
    });
  }

  // Legado: um único horário vale todo dia da semana (não existe cadastro por dia).
  const horario =
    loja.horarioAbertura && loja.horarioFechamento
      ? `${loja.horarioAbertura} às ${loja.horarioFechamento}`
      : 'Horário não informado';
  return DIAS_SEMANA.map((dia) => ({ dia, horario }));
}

/** Faixa que está mantendo a loja aberta agora (própria de hoje, ou de ontem atravessando a meia-noite) — null se nenhuma cobre o instante. */
function faixaAbertaAgora(horarios: HorariosFuncionamento, agora: Date): FaixaHorarioDia | null {
  const minutos = minutosAgora(agora);
  const diaHoje = agora.getDay();
  const diaOntem = (diaHoje + 6) % 7;

  const hoje = horarios.find((d) => d.diaSemana === diaHoje);
  if (hoje?.ativo) {
    for (const faixa of hoje.faixas) {
      const abertura = paraMinutos(faixa.abertura);
      const fechamento = paraMinutos(faixa.fechamento);
      if (abertura < fechamento) {
        if (minutos >= abertura && minutos < fechamento) return faixa;
      } else if (minutos >= abertura) {
        return faixa;
      }
    }
  }

  const ontem = horarios.find((d) => d.diaSemana === diaOntem);
  if (ontem?.ativo) {
    for (const faixa of ontem.faixas) {
      const abertura = paraMinutos(faixa.abertura);
      const fechamento = paraMinutos(faixa.fechamento);
      if (fechamento <= abertura && minutos < fechamento) return faixa;
    }
  }

  return null;
}

/** Próxima abertura a partir de agora: mais tarde hoje, ou o primeiro dia ativo daqui pra frente (varre no máximo 7 dias). */
function proximaAbertura(
  horarios: HorariosFuncionamento,
  agora: Date,
): { quando: 'hoje' | 'amanha' | 'outro_dia'; diaSemana: number; abertura: string } | null {
  const minutos = minutosAgora(agora);
  const diaHoje = agora.getDay();

  const hoje = horarios.find((d) => d.diaSemana === diaHoje);
  if (hoje?.ativo) {
    const proximasHoje = hoje.faixas
      .filter((f) => paraMinutos(f.abertura) > minutos)
      .sort((a, b) => paraMinutos(a.abertura) - paraMinutos(b.abertura));
    if (proximasHoje.length > 0) {
      return { quando: 'hoje', diaSemana: diaHoje, abertura: proximasHoje[0].abertura };
    }
  }

  for (let offset = 1; offset <= 6; offset += 1) {
    const diaSemana = (diaHoje + offset) % 7;
    const dia = horarios.find((d) => d.diaSemana === diaSemana);
    if (dia?.ativo && dia.faixas.length > 0) {
      const primeira = [...dia.faixas].sort(
        (a, b) => paraMinutos(a.abertura) - paraMinutos(b.abertura),
      )[0];
      return {
        quando: offset === 1 ? 'amanha' : 'outro_dia',
        diaSemana,
        abertura: primeira.abertura,
      };
    }
  }

  return null;
}

function mensagemStatusLojaSemanal(
  horarios: HorariosFuncionamento,
  aberto: boolean,
  agora: Date,
): string | null {
  if (aberto) {
    const faixa = faixaAbertaAgora(horarios, agora);
    return faixa ? `Fecha hoje às ${faixa.fechamento}` : null;
  }

  const proxima = proximaAbertura(horarios, agora);
  if (!proxima) return null;

  if (proxima.quando === 'hoje') return `Abre hoje às ${proxima.abertura}`;
  if (proxima.quando === 'amanha') return `Abre amanhã às ${proxima.abertura}`;
  return `Abre ${DIAS_SEMANA[proxima.diaSemana].toLowerCase()} às ${proxima.abertura}`;
}

/**
 * "Fecha hoje às 23:00" / "Abre amanhã às 18:00" — null quando não há
 * horário cadastrado ou a loja é 24h. Best-effort no fuso do navegador do
 * cliente (não necessariamente o da loja) — o `aberto` que decide o texto
 * vem sempre do backend, correto no fuso da loja; aqui só formatamos.
 */
export function mensagemStatusLoja(loja: HorarioLoja, agora: Date = new Date()): string | null {
  if (loja.horariosFuncionamento) {
    return mensagemStatusLojaSemanal(loja.horariosFuncionamento, loja.aberto, agora);
  }

  if (!loja.horarioAbertura || !loja.horarioFechamento) return null;

  const abertura = paraMinutos(loja.horarioAbertura);
  const fechamento = paraMinutos(loja.horarioFechamento);
  if (abertura === fechamento) return null;

  if (loja.aberto) {
    return `Fecha hoje às ${loja.horarioFechamento}`;
  }

  const minutos = minutosAgora(agora);
  if (abertura < fechamento && minutos >= fechamento) {
    return `Abre amanhã às ${loja.horarioAbertura}`;
  }
  return `Abre hoje às ${loja.horarioAbertura}`;
}
