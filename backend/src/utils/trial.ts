/** Trial dura 30 dias corridos a partir da ativação da conta do dono da loja (não da criação da loja). */
export const DURACAO_TRIAL_MS = 30 * 24 * 60 * 60 * 1000;

export function dataFimTrial(inicio: Date): Date {
  return new Date(inicio.getTime() + DURACAO_TRIAL_MS);
}

export type NivelAlertaTrial = 'ok' | 'moderado' | 'critico' | 'expirado' | 'sem_trial';

export interface TrialInfo {
  trialInicioEm: Date | null;
  trialFimEm: Date | null;
  diasRestantes: number | null;
  expirado: boolean;
  nivelAlerta: NivelAlertaTrial;
}

/**
 * Único ponto de verdade sobre dias restantes/nível de alerta do trial —
 * reutilizado no painel do lojista e no Admin Master, pra nunca divergir.
 * diasRestantes é arredondado pra cima (30d 00:00:01 restante ainda conta como 1 dia).
 */
export function calcularTrial(
  trialInicioEm: Date | null,
  trialFimEm: Date | null,
  agora: Date = new Date(),
): TrialInfo {
  if (!trialInicioEm || !trialFimEm) {
    return {
      trialInicioEm: null,
      trialFimEm: null,
      diasRestantes: null,
      expirado: false,
      nivelAlerta: 'sem_trial',
    };
  }

  const diffMs = trialFimEm.getTime() - agora.getTime();
  const expirado = diffMs <= 0;
  const diasRestantes = expirado ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  let nivelAlerta: NivelAlertaTrial;
  if (expirado) nivelAlerta = 'expirado';
  else if (diasRestantes <= 2) nivelAlerta = 'critico';
  else if (diasRestantes <= 7) nivelAlerta = 'moderado';
  else nivelAlerta = 'ok';

  return { trialInicioEm, trialFimEm, diasRestantes, expirado, nivelAlerta };
}
