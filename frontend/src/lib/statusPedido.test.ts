import { describe, expect, it } from 'vitest';
import {
  proximoStatus,
  rotuloProximaAcao,
  rotuloStatus,
  tituloCardPedido,
  transicaoValida,
} from './statusPedido';

describe('proximoStatus', () => {
  it('avança na sequência recebido -> confirmado -> em_preparo -> pronto -> entregue -> finalizado', () => {
    expect(proximoStatus('recebido')).toBe('confirmado');
    expect(proximoStatus('confirmado')).toBe('em_preparo');
    expect(proximoStatus('em_preparo')).toBe('pronto');
    expect(proximoStatus('pronto')).toBe('entregue');
    expect(proximoStatus('entregue')).toBe('finalizado');
  });

  it('finalizado e cancelado não têm próximo status', () => {
    expect(proximoStatus('finalizado')).toBe(null);
    expect(proximoStatus('cancelado')).toBe(null);
  });
});

describe('rotuloProximaAcao', () => {
  it('adapta o texto do botão pra entrega vs retirada', () => {
    expect(rotuloProximaAcao('recebido', 'entrega')).toBe('Aceitar pedido');
    expect(rotuloProximaAcao('confirmado', 'entrega')).toBe('Iniciar preparo');
    expect(rotuloProximaAcao('em_preparo', 'entrega')).toBe('Saiu para entrega');
    expect(rotuloProximaAcao('em_preparo', 'retirada')).toBe('Pronto para retirada');
    expect(rotuloProximaAcao('pronto', 'entrega')).toBe('Marcar como entregue');
    expect(rotuloProximaAcao('pronto', 'retirada')).toBe('Marcar como retirado');
    expect(rotuloProximaAcao('entregue', 'entrega')).toBe('Arquivar pedido');
  });

  it('finalizado e cancelado não têm próxima ação', () => {
    expect(rotuloProximaAcao('finalizado', 'entrega')).toBe(null);
    expect(rotuloProximaAcao('cancelado', 'entrega')).toBe(null);
  });
});

describe('tituloCardPedido', () => {
  it('recebido vira "Novo pedido"', () => {
    expect(tituloCardPedido('recebido', 'entrega')).toBe('Novo pedido');
  });

  it('demais status reaproveitam rotuloStatus', () => {
    expect(tituloCardPedido('em_preparo', 'entrega')).toBe(rotuloStatus('em_preparo', 'entrega'));
    expect(tituloCardPedido('pronto', 'retirada')).toBe(rotuloStatus('pronto', 'retirada'));
    expect(tituloCardPedido('cancelado', 'entrega')).toBe('Cancelado');
  });
});

describe('transicaoValida', () => {
  it('aceita o fluxo linear feliz', () => {
    expect(transicaoValida('recebido', 'confirmado')).toBe(true);
    expect(transicaoValida('confirmado', 'em_preparo')).toBe(true);
    expect(transicaoValida('em_preparo', 'pronto')).toBe(true);
    expect(transicaoValida('pronto', 'entregue')).toBe(true);
    expect(transicaoValida('entregue', 'finalizado')).toBe(true);
  });

  it('rejeita saltos de etapa', () => {
    expect(transicaoValida('recebido', 'em_preparo')).toBe(false);
    expect(transicaoValida('recebido', 'entregue')).toBe(false);
    expect(transicaoValida('confirmado', 'pronto')).toBe(false);
  });

  it('rejeita voltar status', () => {
    expect(transicaoValida('em_preparo', 'recebido')).toBe(false);
    expect(transicaoValida('finalizado', 'entregue')).toBe(false);
  });

  it('permite cancelar até "pronto", nunca depois de entregue/finalizado', () => {
    expect(transicaoValida('recebido', 'cancelado')).toBe(true);
    expect(transicaoValida('confirmado', 'cancelado')).toBe(true);
    expect(transicaoValida('em_preparo', 'cancelado')).toBe(true);
    expect(transicaoValida('pronto', 'cancelado')).toBe(true);
    expect(transicaoValida('entregue', 'cancelado')).toBe(false);
    expect(transicaoValida('finalizado', 'cancelado')).toBe(false);
  });

  it('finalizado e cancelado são terminais', () => {
    expect(transicaoValida('finalizado', 'finalizado')).toBe(false);
    expect(transicaoValida('cancelado', 'recebido')).toBe(false);
  });
});
