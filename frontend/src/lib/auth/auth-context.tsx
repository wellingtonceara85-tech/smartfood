'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Estrutura preparada para o fluxo de autenticação (ADR-0024: JWT + Refresh Token,
 * dois fluxos separados — Usuário com empresa_id+papel, Cliente só com cliente_id).
 * Nesta missão (0008) não há login real — só o contrato pronto para Missão 0009+.
 */
export interface AuthState {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState>({ isAuthenticated: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthState = { isAuthenticated: false };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
