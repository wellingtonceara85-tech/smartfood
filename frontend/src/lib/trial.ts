import { NivelAlertaTrial, TrialInfo } from '../types';

export type CorTrial = 'primary' | 'secondary' | 'yellow' | 'red' | 'gray';

const COR_POR_NIVEL: Record<NivelAlertaTrial, CorTrial> = {
  ok: 'secondary',
  moderado: 'yellow',
  critico: 'red',
  expirado: 'red',
  sem_trial: 'gray',
};

export function corTrial(trial: TrialInfo): CorTrial {
  return COR_POR_NIVEL[trial.nivelAlerta];
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

/**
 * Rótulo curto — usado em badges de tabela. `contaAtivada` distingue duas
 * situações que a API expõe com o mesmo nível "sem_trial": conta ainda
 * aguardando ativação (trial nem pode começar) vs. loja legada já ativa mas
 * sem trial gravado (o Admin Master precisa iniciar manualmente).
 */
export function rotuloTrialCurto(trial: TrialInfo, contaAtivada = true): string {
  if (trial.nivelAlerta === 'sem_trial') {
    return contaAtivada ? 'Período de teste não definido' : 'Ainda não iniciado';
  }
  if (trial.expirado) return 'Trial expirado';
  return `${trial.diasRestantes} ${trial.diasRestantes === 1 ? 'dia restante' : 'dias restantes'}`;
}

/** Mensagem completa — usada no banner do painel do lojista e no detalhe do Admin Master. */
export function mensagemTrial(trial: TrialInfo, contaAtivada = true): string {
  if (trial.nivelAlerta === 'sem_trial') {
    return contaAtivada
      ? 'Esta loja ainda não tem um período de teste definido.'
      : 'O período de avaliação começa assim que você ativa a conta.';
  }
  if (trial.expirado) {
    return `Seu período de teste terminou em ${formatarData(trial.trialFimEm as string)}.`;
  }
  return `Você está utilizando o SmartFood gratuitamente durante o período de avaliação. Seu teste termina em ${formatarData(trial.trialFimEm as string)}.`;
}
