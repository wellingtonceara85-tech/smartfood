const ENDPOINT_VERIFICACAO = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Hostnames de produção do SmartFood (Firebase Hosting) — únicos aceitos
// quando `hostnamesPermitidos` é passado pra verificarTurnstile. Não inclui
// "localhost" de propósito: isso é responsabilidade do widget de
// desenvolvimento/teste, que usa as sitekeys de teste da Cloudflare, nunca
// o site real de produção.
export const HOSTNAMES_PRODUCAO_TURNSTILE = [
  'smartfood-3ab25.web.app',
  'smartfood-3ab25.firebaseapp.com',
];

export type FetchLike = (
  url: string,
  init?: RequestInit,
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

interface RespostaSiteverify {
  success: boolean;
  hostname?: string;
  ['error-codes']?: string[];
}

/**
 * Valida um token do Cloudflare Turnstile diretamente com a Cloudflare —
 * nunca confia só no que o frontend diz. `fetchImpl` é injetável só pra
 * teste (nunca bate na Cloudflare de verdade nos testes automatizados).
 * Token ausente/vazio nem chega a chamar a API — já é inválido.
 *
 * `hostnamesPermitidos`, quando informado, também exige que o `hostname`
 * devolvido pelo siteverify (onde o widget foi resolvido) esteja nessa
 * lista — defesa em profundidade contra um token válido resolvido em outro
 * site/embed. Omitido (undefined) pula essa checagem — é assim que dev/teste
 * usa (as chaves de teste da Cloudflare devolvem "example.com" como
 * hostname, nunca os hosts reais de produção).
 */
export async function verificarTurnstile(
  token: string | null | undefined,
  secretKey: string,
  opcoes: { ip?: string; hostnamesPermitidos?: string[]; fetchImpl?: FetchLike } = {},
): Promise<boolean> {
  if (!token) return false;

  const fetchImpl = opcoes.fetchImpl ?? (fetch as unknown as FetchLike);
  const corpo = new URLSearchParams();
  corpo.set('secret', secretKey);
  corpo.set('response', token);
  if (opcoes.ip) corpo.set('remoteip', opcoes.ip);

  try {
    const resposta = await fetchImpl(ENDPOINT_VERIFICACAO, { method: 'POST', body: corpo });
    if (!resposta.ok) return false;
    const dados = (await resposta.json()) as RespostaSiteverify;
    if (dados.success !== true) return false;
    if (opcoes.hostnamesPermitidos && !opcoes.hostnamesPermitidos.includes(dados.hostname ?? '')) {
      return false;
    }
    return true;
  } catch {
    // Falha de rede/timeout ao falar com a Cloudflare nunca deve travar o
    // servidor nem, principalmente, ser tratada como "token válido" —
    // fecha pro lado seguro (recusa a solicitação).
    return false;
  }
}
