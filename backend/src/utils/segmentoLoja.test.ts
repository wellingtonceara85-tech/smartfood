import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SEGMENTOS_LOJA, segmentoValido, sugerirCategoriasPorSegmento } from './segmentoLoja';

test('todos os segmentos declarados têm chave e rótulo únicos', () => {
  const chaves = SEGMENTOS_LOJA.map((s) => s.chave);
  assert.equal(new Set(chaves).size, chaves.length);
  assert.ok(SEGMENTOS_LOJA.every((s) => s.rotulo.trim().length > 0));
});

test('segmentoValido aceita apenas chaves declaradas', () => {
  assert.equal(segmentoValido('marmitas_refeicoes'), true);
  assert.equal(segmentoValido('inexistente'), false);
});

test('sugestões de categoria nunca incluem produto ou preço — só nomes de categoria', () => {
  for (const segmento of SEGMENTOS_LOJA) {
    const sugestoes = sugerirCategoriasPorSegmento(segmento.chave);
    assert.ok(sugestoes.length > 0, `segmento ${segmento.chave} sem sugestão`);
    for (const nome of sugestoes) {
      assert.equal(typeof nome, 'string');
      assert.ok(!/\d/.test(nome), `sugestão "${nome}" não deveria conter número/preço`);
    }
  }
});

test('segmento desconhecido retorna lista vazia (nunca inventa sugestão)', () => {
  assert.deepEqual(sugerirCategoriasPorSegmento('nao-existe'), []);
});

test('exemplos explícitos do PRD são respeitados', () => {
  assert.deepEqual(sugerirCategoriasPorSegmento('marmitas_refeicoes'), [
    'Marmitas',
    'Pratos do dia',
    'Combos',
    'Bebidas',
    'Sobremesas',
  ]);
  assert.deepEqual(sugerirCategoriasPorSegmento('espetinhos'), [
    'Espetinhos',
    'Combos',
    'Porções',
    'Acompanhamentos',
    'Bebidas',
  ]);
  assert.deepEqual(sugerirCategoriasPorSegmento('bolos'), [
    'Bolos caseiros',
    'Bolos recheados',
    'Mini bolos',
    'Doces',
    'Bebidas',
  ]);
  assert.deepEqual(sugerirCategoriasPorSegmento('salgados'), [
    'Salgados',
    'Mini salgados',
    'Combos',
    'Centos',
    'Bebidas',
  ]);
});
