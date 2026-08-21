import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAMINHO_GUIA_WHATSAPP, montarMensagemBoasVindas } from './mensagemBoasVindas';

function gerarMensagem() {
  return montarMensagemBoasVindas({
    donoNome: 'Maria',
    lojaNome: 'Pratinhos da Quinha',
    linkAtivacao: 'https://smartfood.app/ativar-conta?token=abc123',
    linkCardapio: 'https://smartfood.app/pratinhos-da-quinha',
    linkGuiaWhatsapp: `https://smartfood.app${CAMINHO_GUIA_WHATSAPP}`,
  });
}

test('montarMensagemBoasVindas preenche todos os placeholders, sem sobrar edição manual', () => {
  const mensagem = gerarMensagem();

  assert.match(mensagem, /Olá, \*Maria\*!/);
  assert.match(mensagem, /Pratinhos da Quinha/);
  assert.match(mensagem, /https:\/\/smartfood\.app\/ativar-conta\?token=abc123/);
  assert.match(mensagem, /https:\/\/smartfood\.app\/pratinhos-da-quinha/);
  assert.match(mensagem, /https:\/\/smartfood\.app\/ajuda\/whatsapp-business/);
  assert.doesNotMatch(mensagem, /\[NOME|\[LINK/);
});

test('montarMensagemBoasVindas aplica negrito do WhatsApp (*texto*) nos pontos principais', () => {
  const mensagem = gerarMensagem();

  const trechosEmNegrito = [
    '*Maria*',
    '*Pratinhos da Quinha*',
    '*SmartFood*',
    '*1. Ativação da sua conta*',
    '*7 dias*',
    '*apenas uma vez*',
    '*2. Cardápio público*',
    '*clientes*',
    '*Cadastro dos produtos*',
    '*nome, descrição, preço, foto e demais informações*',
    '*claras, bem enquadradas e que valorizem o produto*',
    '*pode me chamar que eu te ajudo*',
    '*WhatsApp Business*',
    '*me avise*',
  ];

  for (const trecho of trechosEmNegrito) {
    assert.ok(mensagem.includes(trecho), `esperava encontrar "${trecho}" na mensagem`);
  }
});

test('montarMensagemBoasVindas mantém os links sem qualquer formatação de negrito', () => {
  const mensagem = gerarMensagem();
  const linhas = mensagem.split('\n');

  const linhaAtivacao = linhas.find((linha) => linha.includes('ativar-conta?token=abc123'));
  const linhaCardapio = linhas.find(
    (linha) => linha === 'https://smartfood.app/pratinhos-da-quinha',
  );
  const linhaGuia = linhas.find((linha) => linha.includes('ajuda/whatsapp-business'));

  for (const linha of [linhaAtivacao, linhaCardapio, linhaGuia]) {
    assert.ok(linha, 'link esperado não encontrado na mensagem');
    assert.doesNotMatch(linha as string, /\*/, `link não deveria conter "*": ${linha}`);
  }
});
