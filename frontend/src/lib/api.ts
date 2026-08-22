const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getTokens() {
  return {
    accessToken: localStorage.getItem('smartfood_access_token'),
    refreshToken: localStorage.getItem('smartfood_refresh_token'),
  };
}

export function salvarTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('smartfood_access_token', accessToken);
  localStorage.setItem('smartfood_refresh_token', refreshToken);
}

export function limparTokens() {
  localStorage.removeItem('smartfood_access_token');
  localStorage.removeItem('smartfood_refresh_token');
}

interface OpcoesRequisicao {
  method?: string;
  body?: unknown;
  autenticado?: boolean;
}

async function tentarRenovarToken(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  const resposta = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!resposta.ok) return null;

  const dados = await resposta.json();
  localStorage.setItem('smartfood_access_token', dados.accessToken);
  return dados.accessToken as string;
}

export async function api<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { method = 'GET', body, autenticado = false } = opcoes;

  const montarHeaders = (): HeadersInit => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (autenticado) {
      const { accessToken } = getTokens();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  };

  let resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers: montarHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (resposta.status === 401 && autenticado) {
    const novoToken = await tentarRenovarToken();
    if (novoToken) {
      resposta = await fetch(`${API_URL}${caminho}`, {
        method,
        headers: montarHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({ erro: resposta.statusText }));
    throw Object.assign(new Error(erro.erro ?? 'Erro na requisição'), erro);
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

/** Erro lançado por `api()` — além da mensagem, pode carregar campos extras do corpo JSON (ex: `motivo`). */
export interface ApiError extends Error {
  motivo?: string;
}

export async function enviarFoto(arquivo: File): Promise<string> {
  const { accessToken } = getTokens();
  const formData = new FormData();
  formData.append('foto', arquivo);

  const resposta = await fetch(`${API_URL}/api/admin/upload`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({ erro: resposta.statusText }));
    throw new Error(erro.erro ?? 'Erro ao enviar imagem');
  }

  const dados = await resposta.json();
  return dados.url as string;
}
