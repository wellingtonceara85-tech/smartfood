import { describe, expect, it } from 'vitest';
import { indiceDoPasso, passoAnterior, passosDoFluxo } from './onboardingPassos';

describe('passosDoFluxo', () => {
  it('planilha e colar_texto passam por revisão, fotos e prévia', () => {
    expect(passosDoFluxo('planilha')).toEqual([
      'segmento',
      'identidade',
      'funcionamento',
      'cardapio',
      'execucao',
      'revisao',
      'fotos',
      'previa',
      'conclusao',
    ]);
    expect(passosDoFluxo('colar_texto')).toEqual(passosDoFluxo('planilha'));
  });

  it('guiado, manual e arquivo pulam direto pra conclusão', () => {
    expect(passosDoFluxo('guiado')).toEqual([
      'segmento',
      'identidade',
      'funcionamento',
      'cardapio',
      'execucao',
      'conclusao',
    ]);
    expect(passosDoFluxo('manual')).toEqual(passosDoFluxo('guiado'));
    expect(passosDoFluxo('arquivo')).toEqual(passosDoFluxo('guiado'));
  });

  it('sem método escolhido ainda, assume o caminho mais longo', () => {
    expect(passosDoFluxo(null).length).toBe(9);
  });
});

describe('indiceDoPasso', () => {
  it('encontra o índice do passo atual', () => {
    const passos = passosDoFluxo('planilha');
    expect(indiceDoPasso(passos, 'revisao')).toBe(5);
  });

  it('passo nulo ou desconhecido volta pro início', () => {
    const passos = passosDoFluxo('planilha');
    expect(indiceDoPasso(passos, null)).toBe(0);
  });
});

describe('passoAnterior', () => {
  it('retorna o passo anterior na sequência', () => {
    const passos = passosDoFluxo('planilha');
    expect(passoAnterior(passos, 'funcionamento')).toBe('identidade');
  });

  it('no primeiro passo, não há anterior', () => {
    const passos = passosDoFluxo('planilha');
    expect(passoAnterior(passos, 'segmento')).toBe(null);
  });
});
