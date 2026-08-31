import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  idsPossivelmenteDuplicados,
  montarResumoRascunho,
  podePublicar,
  RascunhoProdutoResumo,
} from './validacaoRascunho';

function item(overrides: Partial<RascunhoProdutoResumo>): RascunhoProdutoResumo {
  return {
    id: 'id',
    nome: 'Produto',
    descricao: 'Descrição',
    preco: 10,
    fotoUrl: 'https://x/foto.jpg',
    publicado: false,
    ...overrides,
  };
}

test('podePublicar exige nome e preço positivo', () => {
  assert.equal(podePublicar(item({})), true);
  assert.equal(podePublicar(item({ nome: null })), false);
  assert.equal(podePublicar(item({ nome: '   ' })), false);
  assert.equal(podePublicar(item({ preco: null })), false);
  assert.equal(podePublicar(item({ preco: 0 })), false);
  assert.equal(podePublicar(item({ preco: -5 })), false);
});

test('resumo do exemplo do PRD: conta produtos, sem descrição, sem foto e precisa revisão', () => {
  const itens = [
    item({ id: '1' }),
    item({ id: '2', descricao: null }),
    item({ id: '3', fotoUrl: null }),
    item({ id: '4', nome: null }),
    item({ id: '5', preco: null }),
  ];
  const resumo = montarResumoRascunho(itens, 3);
  assert.equal(resumo.totalProdutos, 5);
  assert.equal(resumo.totalCategorias, 3);
  assert.equal(resumo.semDescricao, 1);
  assert.equal(resumo.semFoto, 1);
  assert.equal(resumo.precisaRevisao, 2);
  assert.equal(resumo.publicaveis, 3);
});

test('detecta duplicados por nome (ignorando acento e caixa)', () => {
  const itens = [
    item({ id: '1', nome: 'Coxinha' }),
    item({ id: '2', nome: 'coxinha' }),
    item({ id: '3', nome: 'Pastel' }),
    item({ id: '4', nome: 'PASTÉL' }),
  ];
  const resumo = montarResumoRascunho(itens, 1);
  assert.equal(resumo.duplicados, 2);

  const ids = idsPossivelmenteDuplicados(itens);
  assert.deepEqual([...ids].sort(), ['1', '2', '3', '4']);
});

test('itens já publicados não entram no resumo nem na contagem de duplicados', () => {
  const itens = [
    item({ id: '1', nome: 'Coxinha', publicado: true }),
    item({ id: '2', nome: 'Coxinha', publicado: false }),
  ];
  const resumo = montarResumoRascunho(itens, 1);
  assert.equal(resumo.totalProdutos, 1);
  assert.equal(resumo.duplicados, 0);
});

test('rascunho totalmente limpo não gera nenhuma pendência', () => {
  const resumo = montarResumoRascunho([item({ id: '1' }), item({ id: '2', nome: 'Outro' })], 2);
  assert.equal(resumo.semDescricao, 0);
  assert.equal(resumo.semFoto, 0);
  assert.equal(resumo.precisaRevisao, 0);
  assert.equal(resumo.duplicados, 0);
});
