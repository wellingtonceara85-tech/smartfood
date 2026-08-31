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
    // status vai junto pro chamador poder distinguir sessão inválida (401,
    // já sobreviveu a uma tentativa de renovação acima) de qualquer outra
    // falha — sem isso não dá pra saber se vale a pena tentar de novo.
    throw Object.assign(new Error(erro.erro ?? 'Erro na requisição'), erro, {
      status: resposta.status,
    });
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

/** Erro lançado por `api()` — além da mensagem, pode carregar campos extras do corpo JSON (ex: `motivo`) e o status HTTP da resposta. */
export interface ApiError extends Error {
  motivo?: string;
  status?: number;
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

async function enviarArquivo<T>(caminho: string, campo: string, arquivo: File): Promise<T> {
  const { accessToken } = getTokens();
  const formData = new FormData();
  formData.append(campo, arquivo);

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({ erro: resposta.statusText }));
    throw Object.assign(new Error(erro.erro ?? 'Erro ao enviar arquivo'), erro, {
      status: resposta.status,
    });
  }
  return resposta.json() as Promise<T>;
}

export function enviarPlanilhaCardapio(
  arquivo: File,
): Promise<{ rascunhoId: string; itensImportados: number }> {
  return enviarArquivo('/api/admin/rascunho-cardapio/planilha', 'arquivo', arquivo);
}

export function enviarArquivoCardapioAssistido(arquivo: File) {
  return enviarArquivo('/api/admin/cardapio-assistido/solicitacoes', 'arquivo', arquivo);
}

/** Só o Admin Master pode reler o arquivo — nunca fica numa URL pública/direta. */
export async function baixarArquivoCardapioAssistido(id: string): Promise<Blob> {
  const { accessToken } = getTokens();
  const resposta = await fetch(`${API_URL}/api/admin-master/cardapios-assistidos/${id}/arquivo`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!resposta.ok) throw new Error('Não foi possível carregar o arquivo');
  return resposta.blob();
}
