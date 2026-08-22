import { describe, expect, it } from 'vitest';
import { produtoConfiguravel, rotuloProdutoIncompleto } from './produto';

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
