import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COR_PRIMARIA_PADRAO, corOuPadrao, corValida, normalizarCor } from './cor';

test('aceita cores hexadecimais válidas', () => {
  assert.equal(corValida('#16A34A'), true);
  assert.equal(corValida('#000000'), true);
  assert.equal(corValida('#ffffff'), true);
});

test('rejeita valores inválidos', () => {
  assert.equal(corValida('16A34A'), false); // sem #
  assert.equal(corValida('#FFF'), false); // shorthand de 3 dígitos
  assert.equal(corValida('#GGGGGG'), false); // não é hex
  assert.equal(corValida('rgb(0,0,0)'), false);
  assert.equal(corValida('hsl(120, 50%, 50%)'), false);
  assert.equal(corValida('javascript:alert(1)'), false);
  assert.equal(corValida('#16A34A; background:url(x)'), false);
  assert.equal(corValida('var(--cor-maliciosa)'), false);
});

test('normaliza pra maiúsculas', () => {
  assert.equal(normalizarCor('#16a34a'), '#16A34A');
});

test('corOuPadrao cai pro padrão quando o valor é ausente ou inválido', () => {
  assert.equal(corOuPadrao(null, COR_PRIMARIA_PADRAO), COR_PRIMARIA_PADRAO);
  assert.equal(corOuPadrao(undefined, COR_PRIMARIA_PADRAO), COR_PRIMARIA_PADRAO);
  assert.equal(corOuPadrao('nao-e-hex', COR_PRIMARIA_PADRAO), COR_PRIMARIA_PADRAO);
  assert.equal(corOuPadrao('#111827', COR_PRIMARIA_PADRAO), '#111827');
  assert.equal(corOuPadrao('#111827', COR_PRIMARIA_PADRAO), '#111827');
});
