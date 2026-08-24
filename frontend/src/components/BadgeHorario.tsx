import { useEffect, useRef, useState } from 'react';
import { listaDiasHorario, mensagemStatusLoja } from '../lib/horario';
import { HorariosFuncionamento } from '../types';

interface Props {
  aberto: boolean;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  horariosFuncionamento?: HorariosFuncionamento | null;
}

const SELETOR_FOCAVEL = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function BadgeHorario({
  aberto,
  horarioAbertura,
  horarioFechamento,
  horariosFuncionamento,
}: Props) {
  const [popoverAberto, setPopoverAberto] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  // Fade + scale só depois do primeiro paint com o popover já montado —
  // sem isso a transição CSS não tem um estado "de" pra animar a partir.
  useEffect(() => {
    if (!popoverAberto) {
      setVisivel(false);
      return;
    }
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, [popoverAberto]);

  // Clique fora, Escape e foco preso enquanto o popover está aberto.
  useEffect(() => {
    if (!popoverAberto) return;

    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverAberto(false);
      }
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPopoverAberto(false);
        botaoRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !containerRef.current) return;
      const focaveis = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL),
      );
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

    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [popoverAberto]);

  const mensagem = mensagemStatusLoja({
    aberto,
    horarioAbertura,
    horarioFechamento,
    horariosFuncionamento,
  });
  const dias = listaDiasHorario({ horarioAbertura, horarioFechamento, horariosFuncionamento });

  return (
    <div ref={containerRef} className="absolute right-4 top-4 text-left">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setPopoverAberto((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={popoverAberto}
        aria-label={`Loja ${aberto ? 'aberta' : 'fechada'}${mensagem ? `, ${mensagem.toLowerCase()}` : ''}. Ver horário de atendimento`}
        className={`cursor-pointer rounded-full px-[13px] py-[5px] text-xs font-bold shadow transition-transform active:scale-95 ${
          aberto ? 'bg-primary text-primary-text' : 'bg-red-500 text-white'
        }`}
      >
        <span aria-hidden="true">{aberto ? '🟢' : '🔴'}</span> {aberto ? 'Aberto' : 'Fechado'}
        {mensagem && <span className="block text-[10px] font-normal opacity-80">{mensagem}</span>}
      </button>

      {popoverAberto && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Horário de atendimento"
          className={`absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-card bg-white p-4 text-gray-800 shadow-card-hover transition-all duration-150 ease-out ${
            visivel ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <p className="mb-2 text-sm font-semibold text-gray-800">Horário de atendimento</p>
          <ul className="flex flex-col gap-1 text-sm text-gray-600">
            {dias.map(({ dia, horario }) => (
              <li key={dia} className="flex justify-between gap-3">
                <span>{dia}</span>
                <span className="text-gray-500">{horario}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-400">
            Os horários são referentes ao horário local da loja.
          </p>
        </div>
      )}
    </div>
  );
}
