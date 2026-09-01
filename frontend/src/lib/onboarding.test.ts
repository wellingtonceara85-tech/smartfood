import { describe, expect, it } from 'vitest';
import { corpoAtualizarSegmento, podeSalvarSegmento, segmentoInicial } from './onboarding';

describe('segmentoInicial — carregar o valor atual em Minha loja', () => {
  it('usa o segmentoNegocio já salvo quando existe', () => {
    expect(segmentoInicial({ segmentoNegocio: 'hamburgueres' })).toBe('hamburgueres');
  });

  it('vira string vazia (nenhuma opção) quando a loja nunca definiu um segmento', () => {
    expect(segmentoInicial({ segmentoNegocio: null })).toBe('');
  });

  it('vira string vazia quando o onboarding ainda não carregou', () => {
    expect(segmentoInicial(null)).toBe('');
  });
});

describe('corpoAtualizarSegmento — payload enviado a PUT /admin/onboarding', () => {
  it('manda só segmentoNegocio, nada mais', () => {
    const corpo = corpoAtualizarSegmento('hamburgueres');
    expect(corpo).toEqual({ segmentoNegocio: 'hamburgueres' });
  });

  it('nunca inclui etapaAtual, status, etapasConcluidas ou metodoCardapio — o objeto tem só uma chave', () => {
    const corpo = corpoAtualizarSegmento('pizza');
    expect(Object.keys(corpo)).toEqual(['segmentoNegocio']);
    expect(corpo).not.toHaveProperty('etapaAtual');
    expect(corpo).not.toHaveProperty('status');
    expect(corpo).not.toHaveProperty('etapasConcluidas');
    expect(corpo).not.toHaveProperty('metodoCardapio');
  });
});

describe('podeSalvarSegmento — o segmento nunca é obrigatório', () => {
  it('permite salvar quando algo foi escolhido', () => {
    expect(podeSalvarSegmento('hamburgueres', false)).toBe(true);
  });

  it('não habilita salvar com o seletor vazio (nenhuma opção escolhida) — mas isso não é um erro de validação, só não há o que enviar', () => {
    expect(podeSalvarSegmento('', false)).toBe(false);
  });

  it('não permite salvar duas vezes ao mesmo tempo (enquanto a chamada anterior está em andamento)', () => {
    expect(podeSalvarSegmento('hamburgueres', true)).toBe(false);
  });
});
