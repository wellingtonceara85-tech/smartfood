import { ReactNode, useEffect, useRef } from 'react';

interface Props {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

const SELETOR_FOCAVEL = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ titulo, aoFechar, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Foco preso dentro do modal, Escape fecha, e o foco volta pra quem abriu
  // o modal ao fechar — sem isso um usuário de teclado/leitor de tela fica
  // "perdido" atrás do overlay ou solto navegando o restante da página.
  useEffect(() => {
    const elementoAnterior = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const primeiroFocavel = container?.querySelector<HTMLElement>(SELETOR_FOCAVEL);
    (primeiroFocavel ?? container)?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        aoFechar();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const focaveis = Array.from(container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL));
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      elementoAnterior?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          tabIndex={-1}
          className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-card bg-white shadow-card-hover focus:outline-none"
        >
          <div className="flex items-center justify-between p-4 pb-3">
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
          <div className="overflow-y-auto px-4 pb-4">{children}</div>
        </div>
      </div>
    </>
  );
}
