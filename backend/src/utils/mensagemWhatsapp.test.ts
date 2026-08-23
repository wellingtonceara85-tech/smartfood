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

test('mensagem de Entrega por distância (sem bairro) não imprime "null"', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    {
      forma: 'entrega',
      bairroNome: null,
      valorEntrega: 0,
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

  assert.match(mensagem, /Forma de recebimento: Entrega \(Grátis\)/);
  assert.doesNotMatch(mensagem, /null/);
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

test('mensagem de pedido agendado destaca a data/hora da encomenda', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    { forma: 'retirada' },
    {
      ...pedidoBase,
      agendamentoFormatado: '30/08/2026 às 17:00',
    },
  );

  assert.match(mensagem, /📅 Encomenda agendada para 30\/08\/2026 às 17:00/);
});

test('mensagem de pedido imediato não menciona agendamento', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.doesNotMatch(mensagem, /Encomenda agendada/);
});

test('item com espaço em branco à direita no nome não quebra o negrito do WhatsApp', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [{ nome: 'Strogonoff de frango ', opcao: null, quantidade: 1, subtotal: 13 }],
    13,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /\*1x Strogonoff de frango\* - R\$ 13,00/);
  assert.doesNotMatch(mensagem, / \*- /);
  assert.doesNotMatch(mensagem, /\*- /);
});

test('item com opção com espaço em branco à direita também fica sem espaço antes do fechamento', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [{ nome: 'X-Burguer', opcao: 'Grande ', quantidade: 2, subtotal: 45.8 }],
    45.8,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /\*2x X-Burguer \(Grande\)\* - R\$ 45,80/);
});

test('múltiplos itens ficam cada um em negrito corretamente, sem quebrar observações', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [
      { nome: 'X-Burguer', opcao: null, quantidade: 1, subtotal: 22.9, observacao: 'Sem cebola' },
      { nome: 'Refrigerante', opcao: 'Lata', quantidade: 2, subtotal: 10 },
    ],
    32.9,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /\*1x X-Burguer\* - R\$ 22,90/);
  assert.match(mensagem, /  Obs: Sem cebola/);
  assert.match(mensagem, /\*2x Refrigerante \(Lata\)\* - R\$ 10,00/);
});
