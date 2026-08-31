import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITENS_NAV = [
  { rota: '/admin/visao-geral', rotulo: 'Visão geral', icone: '📊' },
  { rota: '/admin/lojas', rotulo: 'Lojas', icone: '🏪' },
  { rota: '/admin/cardapios-assistidos', rotulo: 'Cardápios assistidos', icone: '🖼️' },
  { rota: '/admin/feedback', rotulo: 'Feedback', icone: '💡' },
];

export function AdminMasterLayout() {
  const { usuario, logout } = useAuth();

  const linkClasse = ({ isActive }: { isActive: boolean }) =>
    `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-primary-text shadow-sm' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-text"
          >
            S
          </span>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-800">
              SmartFood <span className="font-normal text-gray-400">· Admin Master</span>
            </p>
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

      <nav className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b bg-white px-4 py-2 shadow-sm">
        {ITENS_NAV.map((item) => (
          <NavLink key={item.rota} to={item.rota} className={linkClasse}>
            <span aria-hidden="true">{item.icone}</span>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
