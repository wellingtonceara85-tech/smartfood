import { NavLink } from 'react-router-dom';
import { Loja } from '../../types';
import { ITENS_NAV_PAINEL } from '../../lib/painelNav';
import { StatusLojaCard } from './StatusLojaCard';

interface Props {
  loja: Loja | null;
  aoSair: () => void;
}

const LINK_BASE =
  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

export function SidebarPainel({ loja, aoSair }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r bg-white lg:flex">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-text"
        >
          S
        </span>
        <p className="truncate text-sm font-bold text-gray-800">SmartFood</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {ITENS_NAV_PAINEL.map((item) => (
          <NavLink
            key={item.rota}
            to={item.rota}
            className={({ isActive }) =>
              `${LINK_BASE} ${isActive ? 'bg-primary text-primary-text shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            <span aria-hidden="true">{item.icone}</span>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2 border-t p-3">
        {loja && (
          <StatusLojaCard slug={loja.slug} aberto={loja.aberto} abertoManual={loja.abertoManual} />
        )}
        <button
          onClick={aoSair}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
