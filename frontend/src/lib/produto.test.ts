import { describe, expect, it } from 'vitest';
import { produtoConfiguravel } from './produto';

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
