import { describe, expect, it } from 'vitest';
import { statusOperacionalLoja } from './statusLoja';

describe('statusOperacionalLoja', () => {
  it('automático + dentro do horário -> auto_aberto', () => {
    const status = statusOperacionalLoja({ aberto: true, abertoManual: null });
    expect(status.estado).toBe('auto_aberto');
    expect(status.acao.tipo).toBe('ver_loja');
  });

  it('automático + fora do horário -> auto_fechado', () => {
    const status = statusOperacionalLoja({ aberto: false, abertoManual: null });
    expect(status.estado).toBe('auto_fechado');
    expect(status.acao.tipo).toBe('ver_horarios');
  });

  it('fechada manualmente -> manual_fechado, mesmo se o horário diria aberto', () => {
    const status = statusOperacionalLoja({ aberto: false, abertoManual: false });
    expect(status.estado).toBe('manual_fechado');
    expect(status.icone).toBe('🟠');
  });

  it('aberta manualmente -> manual_aberto, mesmo fora do horário', () => {
    const status = statusOperacionalLoja({ aberto: true, abertoManual: true });
    expect(status.estado).toBe('manual_aberto');
    expect(status.acao.tipo).toBe('ver_loja');
  });
});
