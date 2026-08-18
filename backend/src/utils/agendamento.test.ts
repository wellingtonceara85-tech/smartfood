import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  combinarDataHoraLocalParaUtc,
  formatarAntecedencia,
  validarAgendamento,
} from './agendamento';

test('combinarDataHoraLocalParaUtc converte horário de parede da loja (UTC-3) pro instante UTC correto', () => {
  // 30/08/2026 às 17:00 em America/Fortaleza = 20:00 UTC.
  const data = combinarDataHoraLocalParaUtc('2026-08-30', '17:00');
  assert.equal(data?.toISOString(), '2026-08-30T20:00:00.000Z');
});

test('combinarDataHoraLocalParaUtc rejeita formatos inválidos', () => {
  assert.equal(combinarDataHoraLocalParaUtc('30/08/2026', '17:00'), null);
  assert.equal(combinarDataHoraLocalParaUtc('2026-08-30', '5pm'), null);
  assert.equal(combinarDataHoraLocalParaUtc('', ''), null);
});

test('formatarAntecedencia usa a maior unidade exata', () => {
  assert.equal(formatarAntecedencia(30), '30 minutos');
  assert.equal(formatarAntecedencia(60), '1 hora');
  assert.equal(formatarAntecedencia(90), '90 minutos');
  assert.equal(formatarAntecedencia(120), '2 horas');
  assert.equal(formatarAntecedencia(1440), '1 dia');
  assert.equal(formatarAntecedencia(4320), '3 dias');
});

const lojaBase = {
  aceitaAgendamento: true,
  antecedenciaMinimaMinutos: 2880, // 48h
  horarioAbertura: '10:00',
  horarioFechamento: '23:00',
};

test('rejeita quando a loja não aceita agendamento', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const dataAgendamento = combinarDataHoraLocalParaUtc('2026-08-30', '17:00')!;
  const resultado = validarAgendamento(
    { ...lojaBase, aceitaAgendamento: false },
    dataAgendamento,
    agora,
  );
  assert.equal(resultado.valido, false);
  assert.match(resultado.erro!, /não aceita/);
});

test('rejeita data no passado', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const dataAgendamento = new Date('2026-08-17T11:00:00Z');
  const resultado = validarAgendamento(lojaBase, dataAgendamento, agora);
  assert.equal(resultado.valido, false);
  assert.match(resultado.erro!, /futuro/);
});

test('rejeita quando a antecedência é menor que a mínima configurada', () => {
  // Loja exige 48h; agendamento pra daqui a 5h só.
  const agora = new Date('2026-08-17T12:00:00Z');
  const dataAgendamento = new Date('2026-08-17T17:00:00Z');
  const resultado = validarAgendamento(lojaBase, dataAgendamento, agora);
  assert.equal(resultado.valido, false);
  assert.equal(
    resultado.erro,
    'Esta loja recebe encomendas com pelo menos 2 dias de antecedência.',
  );
});

test('aceita agendamento com antecedência suficiente e horário dentro do funcionamento', () => {
  const agora = new Date('2026-08-17T12:00:00Z'); // 09:00 em Fortaleza
  const dataAgendamento = combinarDataHoraLocalParaUtc('2026-08-30', '17:00')!; // 15 dias depois
  const resultado = validarAgendamento(lojaBase, dataAgendamento, agora);
  assert.deepEqual(resultado, { valido: true });
});

test('rejeita horário fora do funcionamento da loja', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const dataAgendamento = combinarDataHoraLocalParaUtc('2026-08-30', '08:00')!; // antes de abrir (10:00)
  const resultado = validarAgendamento(lojaBase, dataAgendamento, agora);
  assert.equal(resultado.valido, false);
  assert.match(resultado.erro!, /entre 10:00 e 23:00/);
});

test('sem horário cadastrado, pula a validação de funcionamento', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const dataAgendamento = combinarDataHoraLocalParaUtc('2026-08-30', '03:00')!;
  const loja = { ...lojaBase, horarioAbertura: null, horarioFechamento: null };
  const resultado = validarAgendamento(loja, dataAgendamento, agora);
  assert.deepEqual(resultado, { valido: true });
});

test('respeita horário atravessando meia-noite', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const loja = { ...lojaBase, horarioAbertura: '18:00', horarioFechamento: '02:00' };
  // 30/08 às 01:00 em Fortaleza — dentro de 18:00-02:00.
  const dataAgendamento = combinarDataHoraLocalParaUtc('2026-08-30', '01:00')!;
  const resultado = validarAgendamento(loja, dataAgendamento, agora);
  assert.deepEqual(resultado, { valido: true });
});
