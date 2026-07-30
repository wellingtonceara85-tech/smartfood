import { createContext, ReactNode, useContext, useState } from 'react';
import { api, limparTokens, salvarTokens } from '../lib/api';
import { Usuario } from '../types';

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem('smartfood_usuario');
    return salvo ? (JSON.parse(salvo) as Usuario) : null;
  });
  const [carregando, setCarregando] = useState(false);

  async function login(email: string, senha: string) {
    setCarregando(true);
    try {
      const dados = await api<{ accessToken: string; refreshToken: string; usuario: Usuario }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: { email, senha },
        },
      );
      salvarTokens(dados.accessToken, dados.refreshToken);
      localStorage.setItem('smartfood_usuario', JSON.stringify(dados.usuario));
      setUsuario(dados.usuario);
    } finally {
      setCarregando(false);
    }
  }

  function logout() {
    limparTokens();
    localStorage.removeItem('smartfood_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return contexto;
}
