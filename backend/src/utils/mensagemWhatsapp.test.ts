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

test('Pix sem status informado mostra "aguardando pagamento", nunca confirmação automática', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    { forma: 'retirada' },
    pedidoBase,
  );
  assert.match(mensagem, /Pagamento: Pix — aguardando pagamento/);
  assert.match(mensagem, /Chave Pix da loja: loja@pix\.com\.br/);
  assert.doesNotMatch(mensagem, /confirmado|PAGO/i);
});

test('Pix com cliente_informou_pagamento pede confirmação manual ao lojista', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    itensBase,
    22.9,
    { forma: 'retirada' },
    { ...pedidoBase, statusPagamentoPix: 'cliente_informou_pagamento' },
  );
  assert.match(mensagem, /Pagamento: Pix — confirmação manual/);
  assert.match(mensagem, /Cliente informou que realizou o pagamento\./);
  assert.match(mensagem, /Confirme o recebimento antes de preparar\/liberar o pedido\./);
});

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

test('item com grupos de opções mostra cada grupo em linha própria, com as escolhas', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [
      {
        nome: 'Almoço',
        opcao: null,
        quantidade: 1,
        subtotal: 21,
        grupos: [
          { nome: 'Proteínas', opcoes: [{ nome: 'Frango', precoAdicional: 0 }] },
          {
            nome: 'Acompanhamentos',
            opcoes: [
              { nome: 'Arroz', precoAdicional: 0 },
              { nome: 'Feijão', precoAdicional: 0 },
            ],
          },
        ],
      },
    ],
    21,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /\*1x Almoço\* - R\$ 21,00/);
  assert.match(mensagem, /^ {2}Proteínas: Frango$/m);
  assert.match(mensagem, /^ {2}Acompanhamentos: Arroz, Feijão$/m);
});

test('nome de grupo terminado em pontuação (ex: "?") não gruda um ":" em cima — some o separador, mas o espaço antes das escolhas continua', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [
      {
        nome: 'X-Burguer',
        opcao: null,
        quantidade: 1,
        subtotal: 22.9,
        grupos: [
          {
            nome: 'Deseja retirar algum ingrediente?',
            opcoes: [
              { nome: 'Alface', precoAdicional: 0 },
              { nome: 'Tomate', precoAdicional: 0 },
              { nome: 'Cebola', precoAdicional: 0 },
            ],
          },
        ],
      },
    ],
    22.9,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /^ {2}Deseja retirar algum ingrediente\? Alface, Tomate, Cebola$/m);
  assert.doesNotMatch(mensagem, /ingrediente\?:/);
});

test('regra é genérica por pontuação final, não hardcoded pro nome de um grupo específico — cobre "!", "." e ";" também', () => {
  const construir = (nomeGrupo: string) =>
    montarMensagemPedido(
      'Lanchonete Teste',
      [
        {
          nome: 'Produto',
          opcao: null,
          quantidade: 1,
          subtotal: 10,
          grupos: [{ nome: nomeGrupo, opcoes: [{ nome: 'Opção A', precoAdicional: 0 }] }],
        },
      ],
      10,
      { forma: 'retirada' },
      pedidoBase,
    );

  assert.match(construir('Escolha um sabor!'), /^ {2}Escolha um sabor! Opção A$/m);
  assert.match(construir('Alguma observação.'), /^ {2}Alguma observação\. Opção A$/m);
  assert.match(construir('Complementos;'), /^ {2}Complementos; Opção A$/m);
  // Nome sem pontuação continua com ":" normalmente — não é o separador que sumiu de vez.
  assert.match(construir('Adicionais'), /^ {2}Adicionais: Opção A$/m);
});

test('opção de grupo com acréscimo aparece com o valor adicional na mensagem', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [
      {
        nome: 'Almoço',
        opcao: null,
        quantidade: 1,
        subtotal: 21,
        grupos: [{ nome: 'Adicionais', opcoes: [{ nome: 'Bacon', precoAdicional: 3 }] }],
      },
    ],
    21,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /^ {2}Adicionais: Bacon \(\+R\$ 3,00\)$/m);
});

test('item sem grupos (produto legado) não imprime nenhuma linha de grupo', () => {
  const mensagem = montarMensagemPedido(
    'Lanchonete Teste',
    [{ nome: 'Espetinho', opcao: 'Carne', quantidade: 1, subtotal: 8 }],
    8,
    { forma: 'retirada' },
    pedidoBase,
  );

  assert.match(mensagem, /\*1x Espetinho \(Carne\)\* - R\$ 8,00/);
  assert.doesNotMatch(mensagem, /^ {2}\w+:/m);
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
