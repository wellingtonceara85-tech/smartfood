import { Link, NavLink, Outlet } from 'react-router-dom';
import { AvisoTrial } from '../components/AvisoTrial';
import { useAuth } from '../context/AuthContext';

const ITENS_NAV = [
  { rota: '/painel/dashboard', rotulo: 'Dashboard', icone: '📊' },
  { rota: '/painel/produtos', rotulo: 'Produtos', icone: '🍔' },
  { rota: '/painel/pedidos', rotulo: 'Pedidos', icone: '🧾' },
  { rota: '/painel/entrega', rotulo: 'Entrega', icone: '🛵' },
  { rota: '/painel/loja', rotulo: 'Minha loja', icone: '🏪' },
];

export function PainelLayout() {
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

      <nav className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b bg-white px-4 py-2 shadow-sm">
        {ITENS_NAV.map((item) => (
          <NavLink key={item.rota} to={item.rota} className={linkClasse}>
            <span aria-hidden="true">{item.icone}</span>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />

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
  );
}
