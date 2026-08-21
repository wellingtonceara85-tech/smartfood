import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lojaElegivelParaExclusao } from './elegibilidadeExclusao';

test('loja sem produtos e sem pedidos é elegível para exclusão', () => {
  assert.equal(lojaElegivelParaExclusao({ totalProdutos: 0, totalPedidos: 0 }), true);
});

test('loja com produtos não é elegível', () => {
  assert.equal(lojaElegivelParaExclusao({ totalProdutos: 1, totalPedidos: 0 }), false);
});

test('loja com pedidos não é elegível, mesmo sem produtos', () => {
  assert.equal(lojaElegivelParaExclusao({ totalProdutos: 0, totalPedidos: 1 }), false);
});

test('loja com produtos e pedidos não é elegível', () => {
  assert.equal(lojaElegivelParaExclusao({ totalProdutos: 2, totalPedidos: 5 }), false);
});
