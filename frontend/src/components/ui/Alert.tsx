import { ReactNode } from 'react';

type Tipo = 'erro' | 'sucesso' | 'info';

const ESTILOS: Record<Tipo, string> = {
  erro: 'border-red-200 bg-red-50 text-red-700',
  sucesso: 'border-primary/20 bg-primary-light text-primary-hover',
  info: 'border-secondary/20 bg-secondary-light text-secondary-hover',
};

export function Alert({ tipo = 'info', children }: { tipo?: Tipo; children: ReactNode }) {
  return <div className={`rounded-lg border px-3 py-2 text-sm ${ESTILOS[tipo]}`}>{children}</div>;
}
