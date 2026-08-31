import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interpretarPreco } from './precoTexto';

test('aceita formatos numéricos simples', () => {
  assert.equal(interpretarPreco('8'), 8);
  assert.equal(interpretarPreco('8.5'), 8.5);
  assert.equal(interpretarPreco('8.50'), 8.5);
});

test('aceita formato brasileiro com vírgula decimal', () => {
  assert.equal(interpretarPreco('8,00'), 8);
  assert.equal(interpretarPreco('8,5'), 8.5);
  assert.equal(interpretarPreco('1.234,50'), 1234.5);
});

test('tolera prefixo de moeda e espaços', () => {
  assert.equal(interpretarPreco('R$ 8,00'), 8);
  assert.equal(interpretarPreco('r$8,00'), 8);
  assert.equal(interpretarPreco('  8,00  '), 8);
  assert.equal(interpretarPreco('8 reais'), 8);
});

test('rejeita valores não numéricos ou ambíguos em vez de adivinhar', () => {
  assert.equal(interpretarPreco('a combinar'), null);
  assert.equal(interpretarPreco(''), null);
  assert.equal(interpretarPreco('grátis'), null);
  assert.equal(interpretarPreco('8,00-10,00'), null);
  assert.equal(interpretarPreco('oito reais'), null);
});

test('rejeita zero e negativos', () => {
  assert.equal(interpretarPreco('0'), null);
  assert.equal(interpretarPreco('-8'), null);
  assert.equal(interpretarPreco('0,00'), null);
});

test('arredonda pra 2 casas decimais', () => {
  assert.equal(interpretarPreco('8.999'), null); // 3 casas decimais não bate no padrão aceito
  assert.equal(interpretarPreco('8.99'), 8.99);
});
