import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FetchLike, HOSTNAMES_PRODUCAO_TURNSTILE, verificarTurnstile } from './turnstile';

function fetchFalso(respostaJson: unknown, ok = true): FetchLike {
  return async () => ({ ok, json: async () => respostaJson });
}

test('token ausente é inválido sem nem chamar a Cloudflare', async () => {
  let chamou = false;
  const fetchImpl: FetchLike = async () => {
    chamou = true;
    return { ok: true, json: async () => ({ success: true }) };
  };
  assert.equal(await verificarTurnstile(null, 'secret', { fetchImpl }), false);
  assert.equal(await verificarTurnstile('', 'secret', { fetchImpl }), false);
  assert.equal(chamou, false);
});

test('token válido (Cloudflare responde success=true)', async () => {
  const fetchImpl = fetchFalso({ success: true });
  assert.equal(await verificarTurnstile('token-qualquer', 'secret', { fetchImpl }), true);
});

test('token inválido/expirado (Cloudflare responde success=false)', async () => {
  const fetchImpl = fetchFalso({ success: false, 'error-codes': ['timeout-or-duplicate'] });
  assert.equal(await verificarTurnstile('token-usado-de-novo', 'secret', { fetchImpl }), false);
});

test('resposta HTTP não-ok da Cloudflare é tratada como inválido', async () => {
  const fetchImpl = fetchFalso({}, false);
  assert.equal(await verificarTurnstile('token', 'secret', { fetchImpl }), false);
});

test('erro de rede ao chamar a Cloudflare fecha pro lado seguro (inválido)', async () => {
  const fetchImpl: FetchLike = async () => {
    throw new Error('timeout');
  };
  assert.equal(await verificarTurnstile('token', 'secret', { fetchImpl }), false);
});

test('hostnames de produção são exatamente os dois domínios do Firebase Hosting, sem localhost', () => {
  assert.deepEqual(HOSTNAMES_PRODUCAO_TURNSTILE, [
    'smartfood-3ab25.web.app',
    'smartfood-3ab25.firebaseapp.com',
  ]);
  assert.equal(HOSTNAMES_PRODUCAO_TURNSTILE.includes('localhost'), false);
});

test('success=true com hostname fora da lista permitida é recusado', async () => {
  const fetchImpl = fetchFalso({ success: true, hostname: 'site-malicioso.com' });
  assert.equal(
    await verificarTurnstile('token', 'secret', {
      fetchImpl,
      hostnamesPermitidos: HOSTNAMES_PRODUCAO_TURNSTILE,
    }),
    false,
  );
});

test('success=true com hostname de produção válido é aceito', async () => {
  const fetchImpl = fetchFalso({ success: true, hostname: 'smartfood-3ab25.web.app' });
  assert.equal(
    await verificarTurnstile('token', 'secret', {
      fetchImpl,
      hostnamesPermitidos: HOSTNAMES_PRODUCAO_TURNSTILE,
    }),
    true,
  );
});

test('sem hostnamesPermitidos informado, a checagem de hostname é pulada (uso em dev/teste)', async () => {
  const fetchImpl = fetchFalso({ success: true, hostname: 'example.com' });
  assert.equal(await verificarTurnstile('token', 'secret', { fetchImpl }), true);
});

test('envia secret, response e remoteip corretamente pra Cloudflare', async () => {
  const corposRecebidos: URLSearchParams[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    corposRecebidos.push(init?.body as URLSearchParams);
    return { ok: true, json: async () => ({ success: true }) };
  };
  await verificarTurnstile('meu-token', 'meu-secret', { fetchImpl, ip: '1.2.3.4' });
  const corpo = corposRecebidos[0];
  assert.equal(corpo.get('secret'), 'meu-secret');
  assert.equal(corpo.get('response'), 'meu-token');
  assert.equal(corpo.get('remoteip'), '1.2.3.4');
});
