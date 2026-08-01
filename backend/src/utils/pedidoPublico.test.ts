import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projetarPedidoAnteriorPublico } from './pedidoPublico';

const pedidoCompleto = {
  id: 'pedido-1',
  numero: 42,
  clienteNome: 'Maria Cliente',
  clienteTelefone: '85999404661',
  itens: [{ produtoId: 'p1', nome: 'X-Burguer', opcao: null, quantidade: 1, precoUnitario: 22.9 }],
  formaRecebimento: 'entrega',
  bairroEntregaId: 'bairro-1',
  bairroEntregaNome: 'Centro',
  valorEntrega: 5,
  formaPagamento: 'pix',
  precisaTroco: false,
  trocoPara: null,
  tipoCartao: null,
  entregaCep: '60000000',
  entregaLogradouro: 'Rua Exemplo',
  entregaNumero: '123',
  entregaComplemento: null,
  entregaBairro: 'Centro',
  entregaCidade: 'Fortaleza',
  entregaEstado: 'CE',
  entregaReferencia: null,
  status: 'recebido',
  total: 27.9,
  criadoEm: new Date('2026-01-01'),
};

test('projetarPedidoAnteriorPublico devolve só os campos mínimos pra reaproveitamento', () => {
  const projetado = projetarPedidoAnteriorPublico(pedidoCompleto);
  assert.deepEqual(projetado, {
    itens: pedidoCompleto.itens,
    formaRecebimento: 'entrega',
    bairroEntregaId: 'bairro-1',
    formaPagamento: 'pix',
    precisaTroco: false,
    trocoPara: null,
    tipoCartao: null,
  });
});

test('projetarPedidoAnteriorPublico nunca inclui dados pessoais ou endereço', () => {
  const projetado = projetarPedidoAnteriorPublico(pedidoCompleto) as unknown as Record<
    string,
    unknown
  >;
  for (const campoProibido of [
    'id',
    'numero',
    'clienteNome',
    'clienteTelefone',
    'bairroEntregaNome',
    'valorEntrega',
    'entregaCep',
    'entregaLogradouro',
    'entregaNumero',
    'entregaComplemento',
    'entregaBairro',
    'entregaCidade',
    'entregaEstado',
    'entregaReferencia',
    'status',
    'total',
    'criadoEm',
  ]) {
    assert.equal(
      campoProibido in projetado,
      false,
      `campo "${campoProibido}" não deveria estar presente`,
    );
  }
});

test('projetarPedidoAnteriorPublico converte trocoPara Decimal (string/number) pra number', () => {
  const projetado = projetarPedidoAnteriorPublico({
    ...pedidoCompleto,
    trocoPara: '50.00' as never,
  });
  assert.equal(projetado.trocoPara, 50);
});
