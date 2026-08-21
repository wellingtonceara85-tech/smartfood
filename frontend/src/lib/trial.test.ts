import { describe, expect, it } from 'vitest';
import { TrialInfo } from '../types';
import { corTrial, mensagemTrial, rotuloTrialCurto } from './trial';

function trial(parcial: Partial<TrialInfo>): TrialInfo {
  return {
    trialInicioEm: '2026-08-01T12:00:00.000Z',
    trialFimEm: '2026-08-31T12:00:00.000Z',
    diasRestantes: 10,
    expirado: false,
    nivelAlerta: 'ok',
    ...parcial,
  };
}

describe('corTrial', () => {
  it('mapeia cada nível de alerta pra uma cor', () => {
    expect(corTrial(trial({ nivelAlerta: 'ok' }))).toBe('secondary');
    expect(corTrial(trial({ nivelAlerta: 'moderado' }))).toBe('yellow');
    expect(corTrial(trial({ nivelAlerta: 'critico' }))).toBe('red');
    expect(corTrial(trial({ nivelAlerta: 'expirado' }))).toBe('red');
    expect(corTrial(trial({ nivelAlerta: 'sem_trial' }))).toBe('gray');
  });
});

describe('rotuloTrialCurto', () => {
  it('mostra dias restantes no singular e plural', () => {
    expect(rotuloTrialCurto(trial({ diasRestantes: 1 }))).toBe('1 dia restante');
    expect(rotuloTrialCurto(trial({ diasRestantes: 5 }))).toBe('5 dias restantes');
  });

  it('mostra "Trial expirado" quando vencido', () => {
    expect(rotuloTrialCurto(trial({ expirado: true, nivelAlerta: 'expirado' }))).toBe(
      'Trial expirado',
    );
  });

  it('mostra "Ainda não iniciado" quando a conta ainda não foi ativada', () => {
    expect(
      rotuloTrialCurto(
        trial({
          nivelAlerta: 'sem_trial',
          trialFimEm: null,
          trialInicioEm: null,
          diasRestantes: null,
        }),
        false,
      ),
    ).toBe('Ainda não iniciado');
  });

  it('mostra "Período de teste não definido" pra loja legada já ativa sem trial gravado', () => {
    expect(
      rotuloTrialCurto(
        trial({
          nivelAlerta: 'sem_trial',
          trialFimEm: null,
          trialInicioEm: null,
          diasRestantes: null,
        }),
        true,
      ),
    ).toBe('Período de teste não definido');
  });
});

describe('mensagemTrial', () => {
  it('avisa que o trial ainda não começou (conta ainda não ativada)', () => {
    expect(
      mensagemTrial(
        trial({
          nivelAlerta: 'sem_trial',
          trialFimEm: null,
          trialInicioEm: null,
          diasRestantes: null,
        }),
        false,
      ),
    ).toMatch(/começa assim que você ativa/);
  });

  it('avisa que o período de teste não está definido (loja legada já ativa)', () => {
    expect(
      mensagemTrial(
        trial({
          nivelAlerta: 'sem_trial',
          trialFimEm: null,
          trialInicioEm: null,
          diasRestantes: null,
        }),
        true,
      ),
    ).toMatch(/não tem um período de teste definido/);
  });

  it('mostra a data de término formatada quando o trial está ativo', () => {
    expect(mensagemTrial(trial({}))).toMatch(/termina em 31\/08\/2026/);
  });

  it('avisa que o teste terminou quando expirado', () => {
    expect(mensagemTrial(trial({ expirado: true, nivelAlerta: 'expirado' }))).toMatch(
      /terminou em 31\/08\/2026/,
    );
  });
});
