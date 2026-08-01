import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger';
type Tamanho = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  icone?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTES: Record<Variante, string> = {
  primary: 'bg-primary text-primary-text hover:bg-primary-hover focus-visible:outline-primary',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-primary',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost: 'text-primary hover:underline',
  'ghost-danger': 'text-red-600 hover:underline',
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variante = 'primary',
  tamanho = 'md',
  icone,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`${BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`}
      {...props}
    >
      {icone}
      {children}
    </button>
  );
}
