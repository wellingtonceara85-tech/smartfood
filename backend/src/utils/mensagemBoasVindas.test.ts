import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAMINHO_GUIA_WHATSAPP, montarMensagemBoasVindas } from './mensagemBoasVindas';

test('montarMensagemBoasVindas preenche todos os placeholders, sem sobrar edição manual', () => {
  const mensagem = montarMensagemBoasVindas({
    donoNome: 'Maria',
    lojaNome: 'Pratinhos da Quinha',
    linkAtivacao: 'https://smartfood.app/ativar-conta?token=abc123',
    linkCardapio: 'https://smartfood.app/pratinhos-da-quinha',
    linkGuiaWhatsapp: `https://smartfood.app${CAMINHO_GUIA_WHATSAPP}`,
  });

  assert.match(mensagem, /Olá, Maria!/);
  assert.match(mensagem, /Pratinhos da Quinha/);
  assert.match(mensagem, /https:\/\/smartfood\.app\/ativar-conta\?token=abc123/);
  assert.match(mensagem, /https:\/\/smartfood\.app\/pratinhos-da-quinha/);
  assert.match(mensagem, /https:\/\/smartfood\.app\/ajuda\/whatsapp-business/);
  assert.doesNotMatch(mensagem, /\[NOME|\[LINK/);
});
