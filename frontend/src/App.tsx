import { Navigate, Route, Routes } from 'react-router-dom';
import { RotaAdminMaster } from './components/RotaAdminMaster';
import { RotaProtegida } from './components/RotaProtegida';
import { useAuth } from './context/AuthContext';
import { AdminLojas } from './pages/AdminLojas';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { LojaPublica } from './pages/LojaPublica';
import { PainelBairros } from './pages/PainelBairros';
import { PainelLayout } from './pages/PainelLayout';
import { PainelLoja } from './pages/PainelLoja';
import { PainelProdutos } from './pages/PainelProdutos';

export function App() {
  const { usuario } = useAuth();

  const destinoPosLogin = usuario?.papel === 'admin_master' ? '/admin/lojas' : '/painel/produtos';

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={usuario ? <Navigate to={destinoPosLogin} replace /> : <Login />}
      />

      <Route element={<RotaProtegida />}>
        <Route path="/painel" element={<PainelLayout />}>
          <Route index element={<Navigate to="produtos" replace />} />
          <Route path="produtos" element={<PainelProdutos />} />
          <Route path="entrega" element={<PainelBairros />} />
          <Route path="loja" element={<PainelLoja />} />
        </Route>
      </Route>

      <Route element={<RotaAdminMaster />}>
        <Route path="/admin/lojas" element={<AdminLojas />} />
      </Route>

      <Route path="/:slug" element={<LojaPublica />} />
    </Routes>
  );
}
