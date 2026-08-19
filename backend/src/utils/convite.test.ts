import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  conviteValido,
  dataExpiracaoConvite,
  DURACAO_CONVITE_MS,
  gerarTokenConvite,
  hashToken,
} from './convite';

test('gerarTokenConvite produz um token bruto de alta entropia e o hash correspondente', () => {
  const { tokenBruto, tokenHash } = gerarTokenConvite();
  assert.match(tokenBruto, /^[0-9a-f]{64}$/);
  assert.equal(tokenHash, hashToken(tokenBruto));
});

test('gerarTokenConvite nunca repete token entre chamadas', () => {
  const a = gerarTokenConvite();
  const b = gerarTokenConvite();
  assert.notEqual(a.tokenBruto, b.tokenBruto);
  assert.notEqual(a.tokenHash, b.tokenHash);
});

test('hashToken é determinístico', () => {
  assert.equal(hashToken('abc'), hashToken('abc'));
  assert.notEqual(hashToken('abc'), hashToken('abd'));
});

test('dataExpiracaoConvite soma a duração padrão (7 dias)', () => {
  const agora = new Date('2026-08-19T12:00:00Z');
  const expira = dataExpiracaoConvite(agora);
  assert.equal(expira.getTime() - agora.getTime(), DURACAO_CONVITE_MS);
});

test('conviteValido aceita convite dentro do prazo, não usado e não revogado', () => {
  const agora = new Date('2026-08-19T12:00:00Z');
  const convite = {
    expiraEm: new Date('2026-08-26T12:00:00Z'),
    usadoEm: null,
    revogadoEm: null,
  };
  assert.equal(conviteValido(convite, agora), true);
});

test('conviteValido rejeita convite expirado', () => {
  const agora = new Date('2026-08-19T12:00:00Z');
  const convite = {
    expiraEm: new Date('2026-08-18T12:00:00Z'),
    usadoEm: null,
    revogadoEm: null,
  };
  assert.equal(conviteValido(convite, agora), false);
});

test('conviteValido rejeita convite exatamente no instante de expiração', () => {
  const agora = new Date('2026-08-19T12:00:00Z');
  const convite = { expiraEm: agora, usadoEm: null, revogadoEm: null };
  assert.equal(conviteValido(convite, agora), false);
});

test('conviteValido rejeita convite já usado', () => {
  const agora = new Date('2026-08-19T12:00:00Z');
  const convite = {
    expiraEm: new Date('2026-08-26T12:00:00Z'),
    usadoEm: new Date('2026-08-19T10:00:00Z'),
    revogadoEm: null,
  };
  assert.equal(conviteValido(convite, agora), false);
});

test('conviteValido rejeita convite revogado (link regenerado)', () => {
  const agora = new Date('2026-08-19T12:00:00Z');
  const convite = {
    expiraEm: new Date('2026-08-26T12:00:00Z'),
    usadoEm: null,
    revogadoEm: new Date('2026-08-19T11:00:00Z'),
  };
  assert.equal(conviteValido(convite, agora), false);
});
