import { describe, expect, it } from 'vitest';
import { deveExibirNovidade } from './novidades';

describe('deveExibirNovidade', () => {
  it('é verdadeiro quando o usuário nunca viu nenhuma novidade (null)', () => {
    expect(deveExibirNovidade(null, '2026.08.1')).toBe(true);
  });

  it('é falso quando a versão vista é igual à versão atual', () => {
    expect(deveExibirNovidade('2026.08.1', '2026.08.1')).toBe(false);
  });

  it('é verdadeiro quando a versão vista é diferente (mais antiga) da versão atual', () => {
    expect(deveExibirNovidade('2026.07.1', '2026.08.1')).toBe(true);
  });

  it('é verdadeiro de novo quando uma nova versão é publicada após o usuário já ter visto a anterior', () => {
    expect(deveExibirNovidade('2026.08.1', '2026.09.1')).toBe(true);
  });
});
