import { describe, expect, it } from 'vitest';
import { nomeParaSaudacao, periodoDoDia, saudacaoPorHora } from './saudacao';

describe('periodoDoDia', () => {
  it('5h-11h59 é manhã', () => {
    expect(periodoDoDia(5)).toBe('manha');
    expect(periodoDoDia(11)).toBe('manha');
  });

  it('12h-17h59 é tarde', () => {
    expect(periodoDoDia(12)).toBe('tarde');
    expect(periodoDoDia(17)).toBe('tarde');
  });

  it('18h-4h59 é noite (inclui virada do dia)', () => {
    expect(periodoDoDia(18)).toBe('noite');
    expect(periodoDoDia(23)).toBe('noite');
    expect(periodoDoDia(0)).toBe('noite');
    expect(periodoDoDia(4)).toBe('noite');
  });
});

describe('saudacaoPorHora', () => {
  it('retorna o rótulo certo pra cada período', () => {
    expect(saudacaoPorHora(8)).toBe('Bom dia');
    expect(saudacaoPorHora(14)).toBe('Boa tarde');
    expect(saudacaoPorHora(21)).toBe('Boa noite');
  });
});

describe('nomeParaSaudacao', () => {
  it('usa o primeiro nome do usuário quando disponível', () => {
    expect(nomeParaSaudacao('Edilene Souza', 'Loja da Edilene')).toBe('Edilene');
  });

  it('cai pro nome da loja quando não há nome de usuário', () => {
    expect(nomeParaSaudacao(null, 'Loja da Edilene')).toBe('Loja da Edilene');
    expect(nomeParaSaudacao(undefined, 'Loja da Edilene')).toBe('Loja da Edilene');
    expect(nomeParaSaudacao('   ', 'Loja da Edilene')).toBe('Loja da Edilene');
  });

  it('cai pro fallback neutro (null) quando não há nome nenhum', () => {
    expect(nomeParaSaudacao(null, null)).toBe(null);
    expect(nomeParaSaudacao('', '')).toBe(null);
  });
});
