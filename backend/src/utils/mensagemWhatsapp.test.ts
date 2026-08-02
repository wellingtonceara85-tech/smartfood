import assert from 'node:assert/strict';
import { test } from 'node:test';
import { montarMensagemPedido } from './mensagemWhatsapp';

const itensBase = [{ nome: 'X-Burguer', opcao: null, quantidade: 1, subtotal: 22.9 }];

const pedidoBase = {
  numero: 1,
  clienteNome: 'Wellington',
  clienteTelefone: '85999404661',
  formaPagamento: 'pix',
  precisaTroco: false,
  trocoPara: null,
  tipoCartao: null,
  chavePix: 'loja@pix.com.br',
  linkAcompanhamento: 'https://smartfood.app/loja/pedido/123',
};

test('mensagem de Entrega inclui o bloco de endereço', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    27.9,
    {
      forma: 'entrega',
      bairroNome: 'Centro',
      valorEntrega: 5,
      endereco: {
        cep: '60000000',
        logradouro: 'Rua Exemplo',
        numero: '123',
        complemento: 'Apto 201',
        bairro: 'Aldeota',
        cidade: 'Fortaleza',
        estado: 'CE',
        referencia: 'Próximo à praça',
      },
    },
    pedidoBase,
  );

  assert.match(mensagem, /Endereço: Rua Exemplo, 123 - Apto 201 — Aldeota/);
  assert.match(mensagem, /Fortaleza\/CE - CEP: 60000-000/);
  assert.match(mensagem, /Referência: Próximo à praça/);
  assert.match(mensagem, /Entrega - Centro/);
});

test('mensagem de Entrega sem complemento/referência omite essas linhas', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    27.9,
    {
      forma: 'entrega',
      bairroNome: 'Centro',
      valorEntrega: 5,
      endereco: {
        cep: '60000000',
        logradouro: 'Rua Exemplo',
        numero: '123',
        complemento: null,
        bairro: 'Aldeota',
        cidade: 'Fortaleza',
        estado: 'CE',
        referencia: null,
      },
    },
    pedidoBase,
  );

  assert.match(mensagem, /Endereço: Rua Exemplo, 123 — Aldeota$/m);
  assert.doesNotMatch(mensagem, /Referência/);
});

test('mensagem de Retirada não contém bloco de endereço', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /Retirada no local/);
  assert.doesNotMatch(mensagem, /Endereço:/);
  assert.doesNotMatch(mensagem, /CEP:/);
});

test('mensagem inclui a observação do item quando presente', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [{ nome: 'X-Burguer', opcao: null, quantidade: 1, subtotal: 22.9, observacao: 'Sem cebola' }],
    22.9,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /Obs: Sem cebola/);
});

test('mensagem não inclui linha de observação quando ausente', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.doesNotMatch(mensagem, /Obs:/);
});

test('taxa de entrega grátis aparece como "Grátis" em vez de R$ 0,00', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    {
      forma: 'entrega',
      bairroNome: 'Centro',
      valorEntrega: 0,
      endereco: {
        cep: '60000000',
        logradouro: 'Rua Exemplo',
        numero: '123',
        complemento: null,
        bairro: 'Centro',
        cidade: 'Fortaleza',
        estado: 'CE',
        referencia: null,
      },
    },
    pedidoBase,
  );

  assert.match(mensagem, /Entrega - Centro \(Grátis\)/);
  assert.doesNotMatch(mensagem, /R\$ 0,00/);
});
