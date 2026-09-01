import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CategoriaBruta, montarCategoriasPublicas } from './cardapioPublico';

function categoria(overrides: Partial<CategoriaBruta>): CategoriaBruta {
  return {
    id: 'cat-1',
    nome: 'Pratos Executivos',
    ordem: 0,
    produtos: [],
    ...overrides,
  };
}

function produto(id: string, disponivel: boolean) {
  return {
    id,
    nome: `Produto ${id}`,
    descricao: null,
    preco: 10,
    fotoUrl: null,
    disponivel,
    opcoes: null,
    gruposOpcoes: [],
  };
}

// 14. Produto inativo não aparece publicamente ---

test('produto inativo não aparece na lista pública da categoria', () => {
  const [resultado] = montarCategoriasPublicas([
    categoria({ produtos: [produto('ativo', true), produto('inativo', false)] }),
  ]);
  assert.equal(resultado.produtos.length, 1);
  assert.equal(resultado.produtos[0].id, 'ativo');
});

// 16. Categoria sem produtos ativos não aparece publicamente ---

test('categoria em que todos os produtos estão inativos some da resposta pública', () => {
  const resultado = montarCategoriasPublicas([
    categoria({ produtos: [produto('a', false), produto('b', false)] }),
  ]);
  assert.deepEqual(resultado, []);
});

test('categoria sem nenhum produto cadastrado some da resposta pública', () => {
  const resultado = montarCategoriasPublicas([categoria({ produtos: [] })]);
  assert.deepEqual(resultado, []);
});

test('categoria com ao menos um produto ativo continua aparecendo, só sem os inativos', () => {
  const resultado = montarCategoriasPublicas([
    categoria({
      id: 'cat-2',
      produtos: [produto('a', false), produto('b', true), produto('c', false)],
    }),
  ]);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].produtos.length, 1);
  assert.equal(resultado[0].produtos[0].id, 'b');
});

// 17. Grupos/opções inativos também somem da visão pública ---

test('grupo inativo e opção inativa somem da resposta pública, mas o produto continua aparecendo', () => {
  const [resultado] = montarCategoriasPublicas([
    categoria({
      produtos: [
        {
          ...produto('p1', true),
          gruposOpcoes: [
            {
              id: 'g1',
              nome: 'Proteínas',
              minEscolhas: 1,
              maxEscolhas: 1,
              obrigatorio: true,
              ativo: true,
              ordem: 0,
              opcoes: [
                { id: 'o1', nome: 'Frango', precoAdicional: 0, ativo: true, ordem: 0 },
                { id: 'o2', nome: 'Descontinuada', precoAdicional: 0, ativo: false, ordem: 1 },
              ],
            },
            {
              id: 'g2',
              nome: 'Grupo desativado',
              minEscolhas: 0,
              maxEscolhas: 1,
              obrigatorio: false,
              ativo: false,
              ordem: 1,
              opcoes: [],
            },
          ],
        },
      ],
    }),
  ]);
  assert.equal(resultado.produtos[0].gruposOpcoes.length, 1);
  assert.equal(resultado.produtos[0].gruposOpcoes[0].id, 'g1');
  assert.equal(resultado.produtos[0].gruposOpcoes[0].opcoes.length, 1);
  assert.equal(resultado.produtos[0].gruposOpcoes[0].opcoes[0].id, 'o1');
});

test('múltiplas categorias preservam ordem e cada uma filtra seus próprios produtos', () => {
  const resultado = montarCategoriasPublicas([
    categoria({ id: 'cat-a', nome: 'A', produtos: [produto('a1', true)] }),
    categoria({ id: 'cat-b', nome: 'B', produtos: [produto('b1', false)] }),
    categoria({ id: 'cat-c', nome: 'C', produtos: [produto('c1', true)] }),
  ]);
  assert.deepEqual(
    resultado.map((c) => c.id),
    ['cat-a', 'cat-c'],
  );
});
