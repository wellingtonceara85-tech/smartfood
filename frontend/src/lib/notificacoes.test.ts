import { describe, expect, it } from 'vitest';
import {
  adicionarNotificacoes,
  contarNaoLidas,
  criarNotificacaoAgendamentoProximo,
  criarNotificacaoNovoPedido,
  detectarAgendamentosProximos,
  detectarPedidosNovos,
  marcarTodasComoLidas,
  MAX_NOTIFICACOES,
  NotificacaoPainel,
  pedidosPendentesAlerta,
} from './notificacoes';
import { PedidoAdmin } from '../types';

const AGORA = new Date('2026-08-23T18:00:00.000Z');

function pedido(overrides: Partial<PedidoAdmin> = {}): PedidoAdmin {
  return {
    id: 'p1',
    numero: 1000,
    clienteNome: 'Cliente Teste',
    clienteTelefone: '85999999999',
    itens: [],
    formaRecebimento: 'retirada',
    bairroEntregaNome: null,
    valorEntrega: 0,
    formaPagamento: 'pix',
    precisaTroco: null,
    trocoPara: null,
    tipoCartao: null,
    statusPagamento: null,
    pagamentoInformadoEm: null,
    pagamentoConfirmadoEm: null,
    status: 'recebido',
    motivoCancelamento: null,
    tipoPedido: 'imediato',
    dataAgendamento: null,
    total: 50,
    criadoEm: AGORA.toISOString(),
    entregaCep: null,
    entregaLogradouro: null,
    entregaNumero: null,
    entregaComplemento: null,
    entregaBairro: null,
    entregaCidade: null,
    entregaEstado: null,
    entregaReferencia: null,
    ...overrides,
  };
}

describe('detectarPedidosNovos', () => {
  it('primeira carga (idsConhecidos null) não notifica nada', () => {
    const pedidos = [pedido({ id: '1' }), pedido({ id: '2' })];
    expect(detectarPedidosNovos(pedidos, null)).toEqual([]);
  });

  it('detecta só os ids que não estavam no conjunto conhecido', () => {
    const pedidos = [pedido({ id: '1' }), pedido({ id: '2' }), pedido({ id: '3' })];
    const conhecidos = new Set(['1', '2']);
    const novos = detectarPedidosNovos(pedidos, conhecidos);
    expect(novos.map((p) => p.id)).toEqual(['3']);
  });

  it('nenhum pedido novo quando nada mudou', () => {
    const pedidos = [pedido({ id: '1' })];
    expect(detectarPedidosNovos(pedidos, new Set(['1']))).toEqual([]);
  });
});

describe('detectarAgendamentosProximos', () => {
  it('detecta agendamento que entrou na janela de proximidade', () => {
    const proximo = pedido({
      id: 'p1',
      tipoPedido: 'agendado',
      dataAgendamento: new Date(AGORA.getTime() + 30 * 60_000).toISOString(),
    });
    const distante = pedido({
      id: 'p2',
      tipoPedido: 'agendado',
      dataAgendamento: new Date(AGORA.getTime() + 5 * 24 * 60 * 60_000).toISOString(),
    });
    const resultado = detectarAgendamentosProximos([proximo, distante], new Set(), AGORA);
    expect(resultado.map((p) => p.id)).toEqual(['p1']);
  });

  it('não repete um pedido já notificado', () => {
    const proximo = pedido({
      id: 'p1',
      tipoPedido: 'agendado',
      dataAgendamento: new Date(AGORA.getTime() + 30 * 60_000).toISOString(),
    });
    const resultado = detectarAgendamentosProximos([proximo], new Set(['p1']), AGORA);
    expect(resultado).toEqual([]);
  });

  it('ignora pedidos imediatos e agendamentos já entregues/finalizados', () => {
    const imediato = pedido({ id: 'p1', tipoPedido: 'imediato' });
    const entregue = pedido({
      id: 'p2',
      tipoPedido: 'agendado',
      status: 'entregue',
      dataAgendamento: new Date(AGORA.getTime() + 10 * 60_000).toISOString(),
    });
    const resultado = detectarAgendamentosProximos([imediato, entregue], new Set(), AGORA);
    expect(resultado).toEqual([]);
  });
});

describe('adicionarNotificacoes', () => {
  it('coloca notificações novas no topo, sem duplicar por id', () => {
    const existente: NotificacaoPainel = criarNotificacaoNovoPedido(pedido({ id: '1' }), 1000);
    const nova = criarNotificacaoNovoPedido(pedido({ id: '2' }), 2000);
    const duplicata = criarNotificacaoNovoPedido(pedido({ id: '1' }), 3000);

    const resultado = adicionarNotificacoes([existente], [nova, duplicata]);
    expect(resultado.map((n) => n.id)).toEqual([nova.id, existente.id]);
  });

  it('respeita o teto MAX_NOTIFICACOES', () => {
    const atuais = Array.from({ length: MAX_NOTIFICACOES }, (_, i) =>
      criarNotificacaoNovoPedido(pedido({ id: `antigo-${i}` }), i),
    );
    const nova = criarNotificacaoNovoPedido(pedido({ id: 'novo' }), 999_999);
    const resultado = adicionarNotificacoes(atuais, [nova]);
    expect(resultado).toHaveLength(MAX_NOTIFICACOES);
    expect(resultado[0].id).toBe(nova.id);
  });
});

describe('pedidosPendentesAlerta', () => {
  it('só conta pedidos aguardando aceite ("recebido")', () => {
    const pedidos = [
      pedido({ id: '1', status: 'recebido' }),
      pedido({ id: '2', status: 'confirmado' }),
      pedido({ id: '3', status: 'em_preparo' }),
      pedido({ id: '4', status: 'recebido' }),
    ];
    expect(pedidosPendentesAlerta(pedidos).map((p) => p.id)).toEqual(['1', '4']);
  });

  it('aceitar o pedido (mudar pra confirmado) remove a pendência sonora dele', () => {
    const antes = [pedido({ id: '1', status: 'recebido' })];
    const depois = [pedido({ id: '1', status: 'confirmado' })];
    expect(pedidosPendentesAlerta(antes)).toHaveLength(1);
    expect(pedidosPendentesAlerta(depois)).toHaveLength(0);
  });

  it('lista vazia quando não há pedido pendente', () => {
    expect(pedidosPendentesAlerta([])).toEqual([]);
  });
});

describe('contarNaoLidas / marcarTodasComoLidas', () => {
  it('conta corretamente e badge some depois de marcar como lidas', () => {
    const notificacoes = [
      criarNotificacaoNovoPedido(pedido({ id: '1' })),
      criarNotificacaoAgendamentoProximo(pedido({ id: '2' })),
    ];
    expect(contarNaoLidas(notificacoes)).toBe(2);

    const lidas = marcarTodasComoLidas(notificacoes);
    expect(contarNaoLidas(lidas)).toBe(0);
  });
});
