import { describe, expect, it } from 'vitest';
import { statusOperacionalLoja } from './statusLoja';

function tipos(acoes: { tipo: string }[]) {
  return acoes.map((a) => a.tipo);
}

describe('statusOperacionalLoja', () => {
  it('automático + dentro do horário -> auto_aberto, só "Ver loja"', () => {
    const status = statusOperacionalLoja({ aberto: true, abertoManual: null });
    expect(status.estado).toBe('auto_aberto');
    expect(tipos(status.acoes)).toEqual(['ver_loja']);
  });

  it('automático + fora do horário -> auto_fechado, "Ver horários" + "Ver loja"', () => {
    const status = statusOperacionalLoja({ aberto: false, abertoManual: null });
    expect(status.estado).toBe('auto_fechado');
    expect(tipos(status.acoes)).toEqual(['ver_horarios', 'ver_loja']);
  });

  it('fechada manualmente -> manual_fechado, "Ver horários" + "Ver loja"', () => {
    const status = statusOperacionalLoja({ aberto: false, abertoManual: false });
    expect(status.estado).toBe('manual_fechado');
    expect(status.icone).toBe('🟠');
    expect(tipos(status.acoes)).toEqual(['ver_horarios', 'ver_loja']);
  });

  it('aberta manualmente -> manual_aberto, só "Ver loja"', () => {
    const status = statusOperacionalLoja({ aberto: true, abertoManual: true });
    expect(status.estado).toBe('manual_aberto');
    expect(tipos(status.acoes)).toEqual(['ver_loja']);
  });

  it('"Ver loja" está presente em todos os estados', () => {
    const estados = [
      { aberto: true, abertoManual: null },
      { aberto: false, abertoManual: null },
      { aberto: false, abertoManual: false },
      { aberto: true, abertoManual: true },
    ];
    for (const input of estados) {
      const status = statusOperacionalLoja(input);
      expect(tipos(status.acoes)).toContain('ver_loja');
    }
  });
});
