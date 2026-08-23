import { NavLink } from 'react-router-dom';
import { ITENS_NAV_PAINEL } from '../../lib/painelNav';

/**
 * Navegação inferior do painel no mobile/PWA. `env(safe-area-inset-bottom)`
 * exige `viewport-fit=cover` no <meta name="viewport"> (ver index.html) —
 * sem isso o iOS ignora a safe area e a barra some atrás do home indicator.
 */
export function BottomNavPainel() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-white lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITENS_NAV_PAINEL.map((item) => (
        <NavLink
          key={item.rota}
          to={item.rota}
          className={({ isActive }) =>
            `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              isActive ? 'text-primary-hover' : 'text-gray-500'
            }`
          }
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {item.icone}
          </span>
          {item.rotuloCurto}
        </NavLink>
      ))}
    </nav>
  );
}
