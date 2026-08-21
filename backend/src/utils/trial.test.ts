import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularTrial, DURACAO_TRIAL_MS, dataFimTrial } from './trial';

test('dataFimTrial soma 30 dias corridos', () => {
  const inicio = new Date('2026-08-01T10:00:00Z');
  const fim = dataFimTrial(inicio);
  assert.equal(fim.getTime() - inicio.getTime(), DURACAO_TRIAL_MS);
});

test('calcularTrial sem trialInicioEm/trialFimEm retorna sem_trial', () => {
  const info = calcularTrial(null, null);
  assert.equal(info.nivelAlerta, 'sem_trial');
  assert.equal(info.diasRestantes, null);
  assert.equal(info.expirado, false);
});

test('calcularTrial com mais de 7 dias restantes é "ok"', () => {
  const agora = new Date('2026-08-20T12:00:00Z');
  const inicio = new Date('2026-08-01T12:00:00Z');
  const fim = dataFimTrial(inicio); // 2026-08-31
  const info = calcularTrial(inicio, fim, agora);
  assert.equal(info.nivelAlerta, 'ok');
  assert.equal(info.expirado, false);
  assert.equal(info.diasRestantes, 11);
});

test('calcularTrial entre 3 e 7 dias restantes é "moderado"', () => {
  const agora = new Date('2026-08-25T12:00:00Z');
  const fim = new Date('2026-08-31T12:00:00Z');
  const info = calcularTrial(new Date('2026-08-01T12:00:00Z'), fim, agora);
  assert.equal(info.diasRestantes, 6);
  assert.equal(info.nivelAlerta, 'moderado');
});

test('calcularTrial com 1 ou 2 dias restantes é "critico"', () => {
  const agora = new Date('2026-08-29T13:00:00Z');
  const fim = new Date('2026-08-31T12:00:00Z');
  const info = calcularTrial(new Date('2026-08-01T12:00:00Z'), fim, agora);
  assert.equal(info.diasRestantes, 2);
  assert.equal(info.nivelAlerta, 'critico');
});

test('calcularTrial vencido é "expirado" com 0 dias restantes', () => {
  const agora = new Date('2026-09-01T12:00:00Z');
  const fim = new Date('2026-08-31T12:00:00Z');
  const info = calcularTrial(new Date('2026-08-01T12:00:00Z'), fim, agora);
  assert.equal(info.expirado, true);
  assert.equal(info.diasRestantes, 0);
  assert.equal(info.nivelAlerta, 'expirado');
});

test('calcularTrial no instante exato do vencimento já conta como expirado', () => {
  const fim = new Date('2026-08-31T12:00:00Z');
  const info = calcularTrial(new Date('2026-08-01T12:00:00Z'), fim, fim);
  assert.equal(info.expirado, true);
});
