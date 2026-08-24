import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cancelamentoPermitido, transicaoValida } from './statusPedido';

test('fluxo linear feliz é válido em cada etapa', () => {
  assert.equal(transicaoValida('recebido', 'confirmado'), true);
  assert.equal(transicaoValida('confirmado', 'em_preparo'), true);
  assert.equal(transicaoValida('em_preparo', 'pronto'), true);
  assert.equal(transicaoValida('pronto', 'entregue'), true);
  assert.equal(transicaoValida('entregue', 'finalizado'), true);
});

test('não permite pular etapa (salto incoerente)', () => {
  assert.equal(transicaoValida('recebido', 'em_preparo'), false);
  assert.equal(transicaoValida('recebido', 'pronto'), false);
  assert.equal(transicaoValida('recebido', 'entregue'), false);
  assert.equal(transicaoValida('confirmado', 'pronto'), false);
  assert.equal(transicaoValida('em_preparo', 'entregue'), false);
});

test('não permite voltar status', () => {
  assert.equal(transicaoValida('em_preparo', 'recebido'), false);
  assert.equal(transicaoValida('pronto', 'confirmado'), false);
  assert.equal(transicaoValida('finalizado', 'entregue'), false);
});

test('finalizado e cancelado são terminais', () => {
  assert.equal(transicaoValida('finalizado', 'cancelado'), false);
  assert.equal(transicaoValida('cancelado', 'recebido'), false);
  assert.equal(transicaoValida('cancelado', 'confirmado'), false);
});

test('status desconhecido nunca é destino válido', () => {
  assert.equal(transicaoValida('recebido', 'algo_invalido'), false);
});

test('cancelamento permitido até "pronto", não depois de entregue/finalizado', () => {
  assert.equal(cancelamentoPermitido('recebido'), true);
  assert.equal(cancelamentoPermitido('confirmado'), true);
  assert.equal(cancelamentoPermitido('em_preparo'), true);
  assert.equal(cancelamentoPermitido('pronto'), true);
  assert.equal(cancelamentoPermitido('entregue'), false);
  assert.equal(cancelamentoPermitido('finalizado'), false);
  assert.equal(cancelamentoPermitido('cancelado'), false);
});
