import { describe, expect, it } from 'vitest';
import {
  agendaInicialAPartirDoLegado,
  listaDiasHorario,
  mensagemStatusLoja,
  novaAgendaVazia,
} from './horario';
import { DiaHorarioFuncionamento, HorariosFuncionamento } from '../types';

describe('listaDiasHorario (legado — sem agenda semanal própria)', () => {
  it('repete o mesmo horário nos 7 dias quando cadastrado', () => {
    const lista = listaDiasHorario({ horarioAbertura: '18:00', horarioFechamento: '23:00' });
    expect(lista).toHaveLength(7);
    expect(lista[0]).toEqual({ dia: 'Domingo', horario: '18:00 às 23:00' });
    expect(lista[6]).toEqual({ dia: 'Sábado', horario: '18:00 às 23:00' });
  });

  it('mostra "Horário não informado" quando a loja não tem horário cadastrado', () => {
    const lista = listaDiasHorario({ horarioAbertura: null, horarioFechamento: null });
    expect(lista.every((d) => d.horario === 'Horário não informado')).toBe(true);
  });
});

describe('mensagemStatusLoja (legado)', () => {
  it('retorna null quando não há horário cadastrado', () => {
    expect(
      mensagemStatusLoja({ aberto: true, horarioAbertura: null, horarioFechamento: null }),
    ).toBe(null);
  });

  it('retorna null quando a loja funciona 24h (abertura igual ao fechamento)', () => {
    expect(
      mensagemStatusLoja({ aberto: true, horarioAbertura: '00:00', horarioFechamento: '00:00' }),
    ).toBe(null);
  });

  it('quando aberta, mostra o horário de fechamento de hoje', () => {
    const msg = mensagemStatusLoja(
      { aberto: true, horarioAbertura: '18:00', horarioFechamento: '23:00' },
      new Date(2026, 0, 1, 19, 0),
    );
    expect(msg).toBe('Fecha hoje às 23:00');
  });

  it('quando fechada antes de abrir hoje, mostra "Abre hoje"', () => {
    const msg = mensagemStatusLoja(
      { aberto: false, horarioAbertura: '18:00', horarioFechamento: '23:00' },
      new Date(2026, 0, 1, 10, 0),
    );
    expect(msg).toBe('Abre hoje às 18:00');
  });

  it('quando fechada depois de já ter fechado hoje, mostra "Abre amanhã"', () => {
    const msg = mensagemStatusLoja(
      { aberto: false, horarioAbertura: '18:00', horarioFechamento: '23:00' },
      new Date(2026, 0, 1, 23, 30),
    );
    expect(msg).toBe('Abre amanhã às 18:00');
  });

  it('horário atravessando meia-noite: fechada durante o dia mostra "Abre hoje"', () => {
    const msg = mensagemStatusLoja(
      { aberto: false, horarioAbertura: '18:00', horarioFechamento: '02:00' },
      new Date(2026, 0, 1, 10, 0),
    );
    expect(msg).toBe('Abre hoje às 18:00');
  });

  it('horário atravessando meia-noite: aberta de madrugada mostra o fechamento', () => {
    const msg = mensagemStatusLoja(
      { aberto: true, horarioAbertura: '18:00', horarioFechamento: '02:00' },
      new Date(2026, 0, 1, 1, 0),
    );
    expect(msg).toBe('Fecha hoje às 02:00');
  });
});

// --- Agenda semanal ---
// 2026-08-03 = segunda, 2026-08-07 = sexta, 2026-08-08 = sábado, 2026-08-09 = domingo.
// mensagemStatusLoja/listaDiasHorario usam o horário local do navegador — os
// testes usam `new Date(ano, mes, dia, hora, minuto)` (já local), sem fuso a
// converter (diferente dos testes de backend, que usam America/Fortaleza fixo).

function diaFechado(diaSemana: number): DiaHorarioFuncionamento {
  return { diaSemana, ativo: false, faixas: [] };
}

function diaAberto(
  diaSemana: number,
  faixas: { abertura: string; fechamento: string }[],
): DiaHorarioFuncionamento {
  return { diaSemana, ativo: true, faixas };
}

function semanaBase(overrides: Record<number, DiaHorarioFuncionamento>): HorariosFuncionamento {
  const semana: DiaHorarioFuncionamento[] = [];
  for (let dia = 0; dia <= 6; dia += 1) semana.push(overrides[dia] ?? diaFechado(dia));
  return semana;
}

describe('listaDiasHorario (agenda semanal)', () => {
  it('mostra os horários reais de cada dia, incluindo múltiplos períodos', () => {
    const horarios = semanaBase({
      1: diaAberto(1, [
        { abertura: '11:00', fechamento: '14:00' },
        { abertura: '18:00', fechamento: '23:00' },
      ]),
    });
    const lista = listaDiasHorario({
      horarioAbertura: null,
      horarioFechamento: null,
      horariosFuncionamento: horarios,
    });
    const segunda = lista.find((d) => d.dia === 'Segunda-feira');
    expect(segunda?.horario).toBe('11:00 às 14:00 · 18:00 às 23:00');
  });

  it('dia fechado mostra "Fechado"', () => {
    const horarios = semanaBase({});
    const lista = listaDiasHorario({
      horarioAbertura: null,
      horarioFechamento: null,
      horariosFuncionamento: horarios,
    });
    expect(lista.every((d) => d.horario === 'Fechado')).toBe(true);
  });
});

describe('mensagemStatusLoja (agenda semanal)', () => {
  it('aberta agora: mostra o fechamento da faixa em vigor', () => {
    const horarios = semanaBase({
      1: diaAberto(1, [
        { abertura: '11:00', fechamento: '14:00' },
        { abertura: '18:00', fechamento: '23:00' },
      ]),
    });
    // segunda-feira 20:00 -> 2026-08-03 é segunda
    const msg = mensagemStatusLoja(
      {
        aberto: true,
        horarioAbertura: null,
        horarioFechamento: null,
        horariosFuncionamento: horarios,
      },
      new Date(2026, 7, 3, 20, 0),
    );
    expect(msg).toBe('Fecha hoje às 23:00');
  });

  it('fechada entre dois períodos do mesmo dia: "Abre hoje" com o próximo período', () => {
    const horarios = semanaBase({
      1: diaAberto(1, [
        { abertura: '11:00', fechamento: '14:00' },
        { abertura: '18:00', fechamento: '23:00' },
      ]),
    });
    const msg = mensagemStatusLoja(
      {
        aberto: false,
        horarioAbertura: null,
        horarioFechamento: null,
        horariosFuncionamento: horarios,
      },
      new Date(2026, 7, 3, 15, 0), // segunda 15:00, entre os dois períodos
    );
    expect(msg).toBe('Abre hoje às 18:00');
  });

  it('fechada depois do último período de hoje: "Abre amanhã"', () => {
    const horarios = semanaBase({
      1: diaAberto(1, [{ abertura: '11:00', fechamento: '14:00' }]),
      2: diaAberto(2, [{ abertura: '11:00', fechamento: '14:00' }]),
    });
    const msg = mensagemStatusLoja(
      {
        aberto: false,
        horarioAbertura: null,
        horarioFechamento: null,
        horariosFuncionamento: horarios,
      },
      new Date(2026, 7, 3, 20, 0), // segunda 20:00, já passou do único período
    );
    expect(msg).toBe('Abre amanhã às 11:00');
  });

  it('dia fechado e o próximo dia ativo fica alguns dias à frente: mostra o nome do dia', () => {
    const horarios = semanaBase({
      4: diaAberto(4, [{ abertura: '11:00', fechamento: '14:00' }]), // só quinta
    });
    const msg = mensagemStatusLoja(
      {
        aberto: false,
        horarioAbertura: null,
        horarioFechamento: null,
        horariosFuncionamento: horarios,
      },
      new Date(2026, 7, 3, 10, 0), // segunda 10:00 — próxima abertura é quinta
    );
    expect(msg).toBe('Abre quinta-feira às 11:00');
  });

  it('madrugada de sábado ainda com expediente de sexta: mostra o fechamento (02:00)', () => {
    const horarios = semanaBase({
      5: diaAberto(5, [{ abertura: '18:00', fechamento: '02:00' }]),
      6: diaFechado(6),
    });
    const msg = mensagemStatusLoja(
      {
        aberto: true,
        horarioAbertura: null,
        horarioFechamento: null,
        horariosFuncionamento: horarios,
      },
      new Date(2026, 7, 8, 1, 0), // sábado 01:00
    );
    expect(msg).toBe('Fecha hoje às 02:00');
  });

  it('nenhum dia da semana ativo: não há próxima abertura (mensagem null)', () => {
    const horarios = novaAgendaVazia();
    const msg = mensagemStatusLoja(
      {
        aberto: false,
        horarioAbertura: null,
        horarioFechamento: null,
        horariosFuncionamento: horarios,
      },
      new Date(2026, 7, 3, 10, 0),
    );
    expect(msg).toBe(null);
  });
});

describe('agendaInicialAPartirDoLegado', () => {
  it('reaproveita o horário único legado nos 7 dias', () => {
    const agenda = agendaInicialAPartirDoLegado('18:00', '23:00');
    expect(agenda).toHaveLength(7);
    expect(agenda.every((d) => d.ativo)).toBe(true);
    expect(agenda[0].faixas).toEqual([{ abertura: '18:00', fechamento: '23:00' }]);
  });

  it('loja sem nada configurado vira "sempre aberto" nos 7 dias — preserva o comportamento atual', () => {
    const agenda = agendaInicialAPartirDoLegado(null, null);
    expect(agenda.every((d) => d.ativo)).toBe(true);
    expect(agenda[0].faixas).toEqual([{ abertura: '00:00', fechamento: '23:59' }]);
  });
});
