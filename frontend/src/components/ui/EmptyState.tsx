import { ReactNode } from 'react';

interface Props {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function EmptyState({ icone, titulo, descricao, acao }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      {icone && (
        <div aria-hidden="true" className="text-3xl">
          {icone}
        </div>
      )}
      <p className="font-medium text-gray-700">{titulo}</p>
      {descricao && <p className="text-sm text-gray-500">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
