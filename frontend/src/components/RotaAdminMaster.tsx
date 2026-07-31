import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RotaAdminMaster() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.papel !== 'admin_master') return <Navigate to="/painel/produtos" replace />;
  return <Outlet />;
}
