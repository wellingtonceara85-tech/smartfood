import { Navigate, Route, Routes } from 'react-router-dom';
import { RotaAdminMaster } from './components/RotaAdminMaster';
import { RotaProtegida } from './components/RotaProtegida';
import { useAuth } from './context/AuthContext';
import { AcompanharPedido } from './pages/AcompanharPedido';
import { AdminLojaDetalhe } from './pages/AdminLojaDetalhe';
import { AdminLojas } from './pages/AdminLojas';
import { AdminMasterLayout } from './pages/AdminMasterLayout';
import { AdminVisaoGeral } from './pages/AdminVisaoGeral';
import { AjudaInstalarSmartFood } from './pages/AjudaInstalarSmartFood';
import { AjudaWhatsAppBusiness } from './pages/AjudaWhatsAppBusiness';
import { AtivarConta } from './pages/AtivarConta';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { LojaPublica } from './pages/LojaPublica';
import { PainelBairros } from './pages/PainelBairros';
import { PainelDashboard } from './pages/PainelDashboard';
import { PainelLayout } from './pages/PainelLayout';
import { PainelLoja } from './pages/PainelLoja';
import { PainelPedidos } from './pages/PainelPedidos';
import { PainelProdutos } from './pages/PainelProdutos';

export function App() {
  const { usuario } = useAuth();

  const destinoPosLogin =
    usuario?.papel === 'admin_master' ? '/admin/visao-geral' : '/painel/dashboard';

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={usuario ? <Navigate to={destinoPosLogin} replace /> : <Login />}
      />

      <Route element={<RotaProtegida />}>
        <Route path="/painel" element={<PainelLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PainelDashboard />} />
          <Route path="produtos" element={<PainelProdutos />} />
          <Route path="pedidos" element={<PainelPedidos />} />
          <Route path="entrega" element={<PainelBairros />} />
          <Route path="loja" element={<PainelLoja />} />
        </Route>
      </Route>

      <Route element={<RotaAdminMaster />}>
        <Route path="/admin" element={<AdminMasterLayout />}>
          <Route index element={<Navigate to="visao-geral" replace />} />
          <Route path="visao-geral" element={<AdminVisaoGeral />} />
          <Route path="lojas" element={<AdminLojas />} />
          <Route path="lojas/:id" element={<AdminLojaDetalhe />} />
        </Route>
      </Route>

      <Route path="/ativar-conta" element={<AtivarConta />} />
      <Route path="/ajuda/whatsapp-business" element={<AjudaWhatsAppBusiness />} />
      <Route path="/ajuda/instalar-smartfood" element={<AjudaInstalarSmartFood />} />

      <Route path="/:slug/pedido/:pedidoId" element={<AcompanharPedido />} />
      <Route path="/:slug" element={<LojaPublica />} />
    </Routes>
  );
}
