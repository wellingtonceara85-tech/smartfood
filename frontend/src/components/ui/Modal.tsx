import { ReactNode } from 'react';

interface Props {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

export function Modal({ titulo, aoFechar, children }: Props) {
  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-card bg-white p-4 shadow-card-hover">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-gray-800">{titulo}</span>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="rounded-full p-1 text-xl leading-none text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
