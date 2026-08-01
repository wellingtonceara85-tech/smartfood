import { ReactNode } from 'react';

type Cor = 'primary' | 'secondary' | 'gray' | 'red' | 'yellow';

const CORES: Record<Cor, string> = {
  primary: 'bg-primary-light text-primary-hover',
  secondary: 'bg-secondary-light text-secondary-hover',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
};

export function Badge({ cor = 'gray', children }: { cor?: Cor; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CORES[cor]}`}
    >
      {children}
    </span>
  );
}
