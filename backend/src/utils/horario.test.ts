import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularAberto } from './horario';

// America/Fortaleza é UTC-3 fixo (sem horário de verão). Os horários UTC nos
// comentários abaixo mostram o instante convertido pro horário local da loja
// — é isso que calcularAberto precisa acertar mesmo rodando num processo em UTC.

test('abertoManual sempre vence, independente do horário', () => {
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: false };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T13:19:00Z')), false); // 10:19 local, dentro do horário
});

test('sem horário cadastrado, considera sempre aberto', () => {
  const loja = { horarioAbertura: null, horarioFechamento: null, abertoManual: null };
  assert.equal(calcularAberto(loja), true);
});

test('usa o fuso da loja, não o fuso do processo — reproduz o bug de produção', () => {
  // 2026-08-04T00:19:00Z = 03/08 21:19 em America/Fortaleza.
  // Com Date.getHours() (fuso do processo, UTC em produção) isso lia como
  // 00:19 e marcava a loja como fechada mesmo estando aberta às 21:19 local.
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-04T00:19:00Z')), true);
});

test('fechada antes do horário de abertura (fuso local)', () => {
  // 2026-08-03T12:00:00Z = 09:00 em America/Fortaleza — antes de abrir às 10:00.
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T12:00:00Z')), false);
});

test('fechada depois do horário de fechamento (fuso local)', () => {
  // 2026-08-04T02:30:00Z = 03/08 23:30 em America/Fortaleza — já fechou às 23:00.
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-04T02:30:00Z')), false);
});

test('horário atravessando meia-noite: aberta de madrugada (fuso local)', () => {
  // 2026-08-03T04:00:00Z = 01:00 em America/Fortaleza — dentro de 18:00–02:00.
  const loja = { horarioAbertura: '18:00', horarioFechamento: '02:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T04:00:00Z')), true);
});

test('abertura igual ao fechamento é tratado como 24h', () => {
  const loja = { horarioAbertura: '00:00', horarioFechamento: '00:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T12:00:00Z')), true);
});
