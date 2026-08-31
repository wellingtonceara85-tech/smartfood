import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularProgressoLoja } from './progressoLoja';

test('sem nenhuma pendência, loja está 100% pronta', () => {
  assert.equal(calcularProgressoLoja(0), 100);
});

test('cada pendência reduz o percentual proporcionalmente', () => {
  assert.equal(calcularProgressoLoja(1), 67);
  assert.equal(calcularProgressoLoja(2), 33);
  assert.equal(calcularProgressoLoja(3), 0);
});

test('nunca fica negativo mesmo com mais pendências do que critérios conhecidos', () => {
  assert.equal(calcularProgressoLoja(10), 0);
});
