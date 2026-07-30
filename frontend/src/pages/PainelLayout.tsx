import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PainelLayout() {
  const { usuario, logout } = useAuth();

  const linkClasse = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <p className="font-bold text-gray-800">Painel do lojista</p>
          <p className="text-xs text-gray-500">{usuario?.email}</p>
        </div>
        <button onClick={logout} className="text-sm font-medium text-red-600 hover:underline">
          Sair
        </button>
      </header>

      <nav className="flex gap-2 border-b bg-white px-4 py-2">
        <NavLink to="/painel/produtos" className={linkClasse}>
          Produtos
        </NavLink>
        <NavLink to="/painel/loja" className={linkClasse}>
          Minha loja
        </NavLink>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
