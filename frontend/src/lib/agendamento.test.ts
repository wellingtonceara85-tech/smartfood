import { describe, expect, it } from 'vitest';
import {
  agendamentoPareceValido,
  dataMinimaAgendamento,
  formatarAntecedencia,
} from './agendamento';

// Monta "YYYY-MM-DD" a partir das partes LOCAIS do Date — toISOString() usa
// UTC e desalinha com getHours()/getMinutes() (locais) perto da virada do dia.
function dataISOLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

describe('formatarAntecedencia', () => {
  it('usa a maior unidade exata', () => {
    expect(formatarAntecedencia(30)).toBe('30 minutos');
    expect(formatarAntecedencia(60)).toBe('1 hora');
    expect(formatarAntecedencia(90)).toBe('90 minutos');
    expect(formatarAntecedencia(120)).toBe('2 horas');
    expect(formatarAntecedencia(1440)).toBe('1 dia');
    expect(formatarAntecedencia(4320)).toBe('3 dias');
  });
});

describe('dataMinimaAgendamento', () => {
  it('retorna uma data no formato YYYY-MM-DD', () => {
    expect(dataMinimaAgendamento(60)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('agendamentoPareceValido', () => {
  it('rejeita quando faltam data ou hora', () => {
    expect(agendamentoPareceValido('', '17:00', 0)).toBe(false);
    expect(agendamentoPareceValido('2026-08-30', '', 0)).toBe(false);
  });

  it('rejeita data/hora com antecedência menor que a mínima', () => {
    const daqui5min = new Date(Date.now() + 5 * 60_000);
    const dataISO = dataISOLocal(daqui5min);
    const horaHHmm = `${String(daqui5min.getHours()).padStart(2, '0')}:${String(daqui5min.getMinutes()).padStart(2, '0')}`;
    expect(agendamentoPareceValido(dataISO, horaHHmm, 120)).toBe(false);
  });

  it('aceita data/hora com antecedência suficiente', () => {
    const daqui3dias = new Date(Date.now() + 3 * 24 * 60 * 60_000);
    const dataISO = dataISOLocal(daqui3dias);
    const horaHHmm = `${String(daqui3dias.getHours()).padStart(2, '0')}:${String(daqui3dias.getMinutes()).padStart(2, '0')}`;
    expect(agendamentoPareceValido(dataISO, horaHHmm, 60)).toBe(true);
  });
});
