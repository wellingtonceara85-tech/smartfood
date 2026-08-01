import { describe, expect, it } from 'vitest';
import {
  COR_PRIMARIA_PADRAO,
  COR_SECUNDARIA_PADRAO,
  PALETAS_PRONTAS,
  corContraste,
  corValida,
  montarVariaveisTema,
  normalizarCor,
} from './cor';

describe('corValida', () => {
  it('aceita cores hexadecimais válidas', () => {
    expect(corValida('#16A34A')).toBe(true);
    expect(corValida('#000000')).toBe(true);
    expect(corValida('#ffffff')).toBe(true);
  });

  it('rejeita valores inválidos', () => {
    expect(corValida('16A34A')).toBe(false);
    expect(corValida('#FFF')).toBe(false);
    expect(corValida('#GGGGGG')).toBe(false);
    expect(corValida('rgb(0,0,0)')).toBe(false);
    expect(corValida('javascript:alert(1)')).toBe(false);
    expect(corValida('var(--cor-maliciosa)')).toBe(false);
  });
});

it('normaliza pra maiúsculas', () => {
  expect(normalizarCor('#16a34a')).toBe('#16A34A');
});

describe('corContraste', () => {
  it('escolhe texto escuro sobre fundo claro', () => {
    expect(corContraste('#FDE68A')).toBe('#111827');
  });

  it('escolhe texto branco sobre fundo escuro', () => {
    expect(corContraste('#111827')).toBe('#FFFFFF');
  });

  it('escolhe texto branco sobre o verde padrão do SmartFood', () => {
    expect(corContraste(COR_PRIMARIA_PADRAO)).toBe('#FFFFFF');
  });
});

it('todas as paletas prontas têm cores hexadecimais válidas', () => {
  for (const paleta of PALETAS_PRONTAS) {
    expect(corValida(paleta.primaria)).toBe(true);
    expect(corValida(paleta.secundaria)).toBe(true);
  }
});

describe('montarVariaveisTema', () => {
  it('usa as cores da loja quando válidas', () => {
    const vars = montarVariaveisTema('#DC2626', '#F59E0B');
    expect(vars['--color-primary']).toBe('#DC2626');
    expect(vars['--color-secondary']).toBe('#F59E0B');
  });

  it('cai pro padrão quando ausente, nulo ou inválido', () => {
    expect(montarVariaveisTema(undefined, undefined)['--color-primary']).toBe(COR_PRIMARIA_PADRAO);
    expect(montarVariaveisTema(null, null)['--color-secondary']).toBe(COR_SECUNDARIA_PADRAO);
    expect(montarVariaveisTema('nao-e-hex', 'tambem-nao')['--color-primary']).toBe(
      COR_PRIMARIA_PADRAO,
    );
  });

  it('duas lojas com cores diferentes não interferem uma na outra', () => {
    const lojaA = montarVariaveisTema('#DC2626', '#F59E0B');
    const lojaB = montarVariaveisTema('#7E22CE', '#DB2777');
    expect(lojaA['--color-primary']).toBe('#DC2626');
    expect(lojaB['--color-primary']).toBe('#7E22CE');
    expect(lojaA['--color-primary']).not.toBe(lojaB['--color-primary']);
  });
});
