import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mensagemTrial } from '../lib/trial';
import { Loja, NivelAlertaTrial } from '../types';

const ESTILO_POR_NIVEL: Record<NivelAlertaTrial, string> = {
  ok: 'border-gray-200 bg-white text-gray-500',
  moderado: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  critico: 'border-red-200 bg-red-50 text-red-800',
  expirado: 'border-red-300 bg-red-100 text-red-900',
  sem_trial: 'hidden',
};

export function AvisoTrial() {
  const [loja, setLoja] = useState<Loja | null>(null);

  useEffect(() => {
    api<Loja>('/api/admin/loja', { autenticado: true })
      .then(setLoja)
      .catch(() => undefined);
  }, []);

  if (!loja || loja.trial.nivelAlerta === 'sem_trial') return null;

  return (
    <div
      className={`border-b px-4 py-2 text-center text-sm ${ESTILO_POR_NIVEL[loja.trial.nivelAlerta]}`}
    >
      {mensagemTrial(loja.trial)}
    </div>
  );
}
