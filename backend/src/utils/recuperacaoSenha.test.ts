import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DURACAO_RECUPERACAO_MS,
  dataExpiracaoRecuperacao,
  gerarTokenRecuperacao,
  tokenRecuperacaoValido,
} from './recuperacaoSenha';

test('gera um token bruto não vazio, diferente a cada chamada', () => {
  const a = gerarTokenRecuperacao();
  const b = gerarTokenRecuperacao();
  assert.ok(a.tokenBruto.length > 0);
  assert.notEqual(a.tokenBruto, b.tokenBruto);
});

test('expiração é bem mais curta que o convite de ativação (1 hora)', () => {
  assert.equal(DURACAO_RECUPERACAO_MS, 60 * 60 * 1000);
});

test('token recém-criado (não usado, não revogado, não expirado) é válido', () => {
  const agora = new Date('2026-01-01T12:00:00Z');
  const recuperacao = {
    expiraEm: dataExpiracaoRecuperacao(agora),
    usadoEm: null,
    revogadoEm: null,
  };
  assert.equal(tokenRecuperacaoValido(recuperacao, agora), true);
});

test('token expirado não é válido', () => {
  const agora = new Date('2026-01-01T12:00:00Z');
  const recuperacao = { expiraEm: new Date(agora.getTime() - 1), usadoEm: null, revogadoEm: null };
  assert.equal(tokenRecuperacaoValido(recuperacao, agora), false);
});

test('token no instante exato do vencimento já é inválido', () => {
  const agora = new Date('2026-01-01T12:00:00Z');
  const recuperacao = { expiraEm: agora, usadoEm: null, revogadoEm: null };
  assert.equal(tokenRecuperacaoValido(recuperacao, agora), false);
});

test('token já usado não é válido, mesmo dentro do prazo', () => {
  const agora = new Date('2026-01-01T12:00:00Z');
  const recuperacao = {
    expiraEm: dataExpiracaoRecuperacao(agora),
    usadoEm: new Date(agora.getTime() - 1000),
    revogadoEm: null,
  };
  assert.equal(tokenRecuperacaoValido(recuperacao, agora), false);
});

test('token revogado (nova solicitação substituiu este) não é válido', () => {
  const agora = new Date('2026-01-01T12:00:00Z');
  const recuperacao = {
    expiraEm: dataExpiracaoRecuperacao(agora),
    usadoEm: null,
    revogadoEm: new Date(agora.getTime() - 1000),
  };
  assert.equal(tokenRecuperacaoValido(recuperacao, agora), false);
});
