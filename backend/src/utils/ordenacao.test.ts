import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularNovaOrdem, proximaOrdem } from './ordenacao';

test('calcularNovaOrdem: permutação válida mapeia cada id pro seu índice', () => {
  const resultado = calcularNovaOrdem(['a', 'b', 'c'], ['c', 'a', 'b']);
  assert.equal(resultado.valida, true);
  assert.equal(resultado.ordemPorId?.get('c'), 0);
  assert.equal(resultado.ordemPorId?.get('a'), 1);
  assert.equal(resultado.ordemPorId?.get('b'), 2);
});

test('calcularNovaOrdem: rejeita lista com item faltando', () => {
  const resultado = calcularNovaOrdem(['a', 'b', 'c'], ['a', 'b']);
  assert.equal(resultado.valida, false);
});

test('calcularNovaOrdem: rejeita lista com item a mais (payload adulterado)', () => {
  const resultado = calcularNovaOrdem(['a', 'b'], ['a', 'b', 'x']);
  assert.equal(resultado.valida, false);
});

test('calcularNovaOrdem: rejeita id que não pertence ao recurso (ex: de outra loja)', () => {
  const resultado = calcularNovaOrdem(['a', 'b', 'c'], ['a', 'b', 'outra-loja']);
  assert.equal(resultado.valida, false);
});

test('calcularNovaOrdem: rejeita id duplicado', () => {
  const resultado = calcularNovaOrdem(['a', 'b', 'c'], ['a', 'a', 'c']);
  assert.equal(resultado.valida, false);
});

test('calcularNovaOrdem: lista vazia é válida (recurso sem itens)', () => {
  const resultado = calcularNovaOrdem([], []);
  assert.equal(resultado.valida, true);
  assert.equal(resultado.ordemPorId?.size, 0);
});

test('proximaOrdem: 0 quando a lista está vazia', () => {
  assert.equal(proximaOrdem([]), 0);
});

test('proximaOrdem: maior ordem + 1, mesmo fora de sequência', () => {
  assert.equal(proximaOrdem([{ ordem: 0 }, { ordem: 3 }, { ordem: 1 }]), 4);
});
