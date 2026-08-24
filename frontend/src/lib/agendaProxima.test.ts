import { describe, expect, it } from 'vitest';
import {
  contarPedidosPrecisandoAtencao,
  formatarAgendamentoCurto,
  LIMIAR_PROXIMIDADE_MINUTOS,
  ordenarProximosPedidos,
  proximidadeAgendamento,
} from './agendaProxima';
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
    status: 'recebido',
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

describe('proximidadeAgendamento', () => {
  it('futuro distante (além do limiar)', () => {
    const daqui2h = new Date(AGORA.getTime() + 120 * 60_000).toISOString();
    expect(proximidadeAgendamento(daqui2h, AGORA)).toBe('distante');
  });

  it('dentro do limiar de proximidade', () => {
    const daqui30min = new Date(AGORA.getTime() + 30 * 60_000).toISOString();
    expect(proximidadeAgendamento(daqui30min, AGORA)).toBe('proximo');
  });

  it('exatamente no limiar ainda conta como próximo', () => {
    const noLimiar = new Date(AGORA.getTime() + LIMIAR_PROXIMIDADE_MINUTOS * 60_000).toISOString();
    expect(proximidadeAgendamento(noLimiar, AGORA)).toBe('proximo');
  });

  it('já passou da hora — atrasado', () => {
    const passou10min = new Date(AGORA.getTime() - 10 * 60_000).toISOString();
    expect(proximidadeAgendamento(passou10min, AGORA)).toBe('atrasado');
  });
});

describe('formatarAgendamentoCurto', () => {
  it('hoje mostra "Hoje às HH:mm"', () => {
    const hojeMaisTarde = new Date('2026-08-23T21:30:00.000Z');
    expect(formatarAgendamentoCurto(hojeMaisTarde.toISOString(), AGORA)).toMatch(/^Hoje às /);
  });

  it('amanhã mostra "Amanhã às HH:mm"', () => {
    const amanha = new Date('2026-08-24T13:00:00.000Z');
    expect(formatarAgendamentoCurto(amanha.toISOString(), AGORA)).toMatch(/^Amanhã às /);
  });

  it('outra data mostra dd/mm às HH:mm', () => {
    const depoisDeAmanha = new Date('2026-08-27T18:00:00.000Z');
    expect(formatarAgendamentoCurto(depoisDeAmanha.toISOString(), AGORA)).toMatch(
      /^\d{2}\/\d{2} às /,
    );
  });
});

describe('ordenarProximosPedidos', () => {
  it('agendamento atrasado vem antes de tudo', () => {
    const atrasado = pedido({
      id: 'atrasado',
      tipoPedido: 'agendado',
      status: 'recebido',
      dataAgendamento: new Date(AGORA.getTime() - 5 * 60_000).toISOString(),
    });
    const recebidoImediato = pedido({ id: 'imediato', status: 'recebido' });
    const resultado = ordenarProximosPedidos([recebidoImediato, atrasado], AGORA);
    expect(resultado[0].id).toBe('atrasado');
  });

  it('recebido/em_preparo vêm antes de agendamento distante', () => {
    const distante = pedido({
      id: 'distante',
      tipoPedido: 'agendado',
      status: 'recebido',
      dataAgendamento: new Date(AGORA.getTime() + 5 * 24 * 60 * 60_000).toISOString(),
    });
    const emPreparo = pedido({ id: 'preparo', status: 'em_preparo' });
    const resultado = ordenarProximosPedidos([distante, emPreparo], AGORA);
    expect(resultado[0].id).toBe('preparo');
    expect(resultado[1].id).toBe('distante');
  });

  it('exclui pedidos entregues e finalizados', () => {
    const entregue = pedido({ id: 'entregue', status: 'entregue' });
    const finalizado = pedido({ id: 'finalizado', status: 'finalizado' });
    const ativo = pedido({ id: 'ativo', status: 'recebido' });
    const resultado = ordenarProximosPedidos([entregue, finalizado, ativo], AGORA);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('ativo');
  });

  it('lista vazia gera lista vazia (aciona o empty state no Dashboard)', () => {
    expect(ordenarProximosPedidos([], AGORA)).toEqual([]);
  });
});

describe('contarPedidosPrecisandoAtencao', () => {
  it('conta só os pedidos com status "recebido"', () => {
    const pedidos = [
      pedido({ id: '1', status: 'recebido' }),
      pedido({ id: '2', status: 'recebido' }),
      pedido({ id: '3', status: 'em_preparo' }),
      pedido({ id: '4', status: 'finalizado' }),
    ];
    expect(contarPedidosPrecisandoAtencao(pedidos)).toBe(2);
  });
});
