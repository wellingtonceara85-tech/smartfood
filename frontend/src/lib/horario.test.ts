import { describe, expect, it } from 'vitest';
import { listaDiasHorario, mensagemStatusLoja } from './horario';

describe('listaDiasHorario', () => {
  it('repete o mesmo horário nos 7 dias quando cadastrado', () => {
    const lista = listaDiasHorario('18:00', '23:00');
    expect(lista).toHaveLength(7);
    expect(lista[0]).toEqual({ dia: 'Domingo', horario: '18:00 às 23:00' });
    expect(lista[6]).toEqual({ dia: 'Sábado', horario: '18:00 às 23:00' });
  });

  it('mostra "Horário não informado" quando a loja não tem horário cadastrado', () => {
    const lista = listaDiasHorario(null, null);
    expect(lista.every((d) => d.horario === 'Horário não informado')).toBe(true);
  });
});

describe('mensagemStatusLoja', () => {
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
