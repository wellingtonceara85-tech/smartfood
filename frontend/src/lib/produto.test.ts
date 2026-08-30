import { describe, expect, it } from 'vitest';
import {
  agruparProdutosPorCategoria,
  produtoConfiguravel,
  rotuloProdutoIncompleto,
} from './produto';

describe('produtoConfiguravel', () => {
  it('é falso quando opcoes é null', () => {
    expect(produtoConfiguravel({ opcoes: null })).toBe(false);
  });

  it('é falso quando opcoes é uma lista vazia', () => {
    expect(produtoConfiguravel({ opcoes: [] })).toBe(false);
  });

  it('é verdadeiro quando existe ao menos uma opção', () => {
    expect(produtoConfiguravel({ opcoes: ['Ao ponto', 'Bem passado'] })).toBe(true);
  });
});

describe('rotuloProdutoIncompleto', () => {
  it('é null quando tem foto e descrição', () => {
    expect(
      rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: 'Descrição ok' }),
    ).toBe(null);
  });

  it('sinaliza "Sem foto" quando só falta a foto', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: null, descricao: 'Descrição ok' })).toBe('Sem foto');
  });

  it('sinaliza "Sem descrição" quando só falta a descrição', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: null })).toBe(
      'Sem descrição',
    );
  });

  it('trata descrição vazia ou só com espaços como ausente', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: '' })).toBe(
      'Sem descrição',
    );
    expect(rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: '   ' })).toBe(
      'Sem descrição',
    );
  });

  it('sinaliza "Sem foto e descrição" quando faltam os dois', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: null, descricao: null })).toBe(
      'Sem foto e descrição',
    );
  });
});

describe('agruparProdutosPorCategoria', () => {
  const categorias = [
    { id: 'cat-bebidas', nome: 'Bebidas' },
    { id: 'cat-lanches', nome: 'Lanches' },
  ];

  it('agrupa cada produto na categoria certa, respeitando a ordem das categorias', () => {
    const produtos = [
      { id: 'p1', categoriaId: 'cat-lanches', ordem: 0 },
      { id: 'p2', categoriaId: 'cat-bebidas', ordem: 0 },
    ];
    const grupos = agruparProdutosPorCategoria(categorias, produtos);
    expect(grupos.map((g) => g.categoria.id)).toEqual(['cat-bebidas', 'cat-lanches']);
    expect(grupos[0].produtos.map((p) => p.id)).toEqual(['p2']);
    expect(grupos[1].produtos.map((p) => p.id)).toEqual(['p1']);
  });

  it('ordena os produtos dentro de cada grupo pelo campo ordem', () => {
    const produtos = [
      { id: 'terceiro', categoriaId: 'cat-lanches', ordem: 2 },
      { id: 'primeiro', categoriaId: 'cat-lanches', ordem: 0 },
      { id: 'segundo', categoriaId: 'cat-lanches', ordem: 1 },
    ];
    const grupos = agruparProdutosPorCategoria(categorias, produtos);
    const lanches = grupos.find((g) => g.categoria.id === 'cat-lanches');
    expect(lanches?.produtos.map((p) => p.id)).toEqual(['primeiro', 'segundo', 'terceiro']);
  });

  it('categoria sem produtos gera grupo com lista vazia', () => {
    const grupos = agruparProdutosPorCategoria(categorias, []);
    expect(grupos.every((g) => g.produtos.length === 0)).toBe(true);
  });

  it('produto cuja categoria não existe mais na lista simplesmente não aparece', () => {
    const produtos = [{ id: 'orfao', categoriaId: 'cat-inexistente', ordem: 0 }];
    const grupos = agruparProdutosPorCategoria(categorias, produtos);
    const totalProdutos = grupos.reduce((soma, g) => soma + g.produtos.length, 0);
    expect(totalProdutos).toBe(0);
  });
});
