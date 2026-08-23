import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AvisoTrial } from '../components/AvisoTrial';
import { BottomNavPainel } from '../components/painel/BottomNavPainel';
import { SidebarPainel } from '../components/painel/SidebarPainel';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Loja } from '../types';

export interface PainelLayoutContexto {
  loja: Loja | null;
  recarregarLoja: () => void;
}

export function PainelLayout() {
  const { usuario, logout } = useAuth();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [versaoLoja, setVersaoLoja] = useState(0);

  useEffect(() => {
    api<Loja>('/api/admin/loja', { autenticado: true })
      .then(setLoja)
      .catch(() => undefined);
  }, [versaoLoja]);

  function recarregarLoja() {
    setVersaoLoja((v) => v + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarPainel loja={loja} aoSair={logout} />

      <div className="lg:pl-60">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-text"
            >
              S
            </span>
            <div>
              <p className="text-sm font-bold leading-tight text-gray-800">SmartFood</p>
              <p className="text-xs leading-tight text-gray-500">{usuario?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Sair
          </button>
        </header>

        <AvisoTrial />

        {/* pb extra + safe-area no mobile pra nada ficar escondido atrás da bottom nav fixa; lg+ não tem bottom nav. */}
        <main className="mx-auto max-w-6xl px-4 py-6 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-6">
          <Outlet context={{ loja, recarregarLoja } satisfies PainelLayoutContexto} />

          <p className="mt-8 text-center text-xs text-gray-400">
            Adicione o SmartFood à tela inicial →{' '}
            <Link
              to="/ajuda/instalar-smartfood"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gray-600"
            >
              Ver como adicionar
            </Link>
          </p>
        </main>
      </div>

      <BottomNavPainel />
    </div>
  );
}
