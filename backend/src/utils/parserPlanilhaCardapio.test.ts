import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePlanilhaCardapio } from './parserPlanilhaCardapio';

test('lê planilha com cabeçalhos exatos', () => {
  const itens = parsePlanilhaCardapio([
    {
      categoria: 'Espetinhos',
      produto: 'Espetinho de Carne',
      descricao: 'Feito na brasa',
      preco: 8.5,
      disponibilidade: 'sim',
      observacoes: '',
    },
  ]);
  assert.equal(itens.length, 1);
  assert.deepEqual(itens[0], {
    categoria: 'Espetinhos',
    nome: 'Espetinho de Carne',
    descricao: 'Feito na brasa',
    preco: 8.5,
    precoTexto: null,
    disponivel: true,
    observacoes: null,
    precisaRevisao: false,
    motivosRevisao: [],
  });
});

test('tolera variações de nome de coluna (acento, sinônimo, maiúscula)', () => {
  const itens = parsePlanilhaCardapio([
    { Categoria: 'Bebidas', Nome: 'Suco de laranja', Valor: '6,00', Obs: 'Sem açúcar' },
  ]);
  assert.equal(itens[0].categoria, 'Bebidas');
  assert.equal(itens[0].nome, 'Suco de laranja');
  assert.equal(itens[0].preco, 6);
  assert.equal(itens[0].observacoes, 'Sem açúcar');
});

test('produto sem nome ou sem preço reconhecível vai para revisão, sem inventar valor', () => {
  const itens = parsePlanilhaCardapio([
    { produto: '', preco: 10 },
    { produto: 'Prato executivo', preco: 'a combinar' },
  ]);
  assert.equal(itens[0].nome, null);
  assert.deepEqual(itens[0].motivosRevisao, ['sem_nome']);

  assert.equal(itens[1].preco, null);
  assert.deepEqual(itens[1].motivosRevisao, ['preco_nao_reconhecido']);
});

test('coluna de disponibilidade reconhece valores negativos comuns', () => {
  const itens = parsePlanilhaCardapio([
    { produto: 'A', preco: 5, disponivel: 'não' },
    { produto: 'B', preco: 5, disponivel: 'inativo' },
    { produto: 'C', preco: 5, disponivel: 'sim' },
    { produto: 'D', preco: 5 },
  ]);
  assert.deepEqual(
    itens.map((i) => i.disponivel),
    [false, false, true, true],
  );
});

test('planilha vazia retorna lista vazia', () => {
  assert.deepEqual(parsePlanilhaCardapio([]), []);
});

test('sem coluna de categoria mapeável, categoria fica null (não inventa)', () => {
  const itens = parsePlanilhaCardapio([{ produto: 'X', preco: 5 }]);
  assert.equal(itens[0].categoria, null);
});
