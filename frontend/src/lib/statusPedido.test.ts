import { describe, expect, it } from 'vitest';
import { proximoStatus, rotuloProximaAcao, rotuloStatus, tituloCardPedido } from './statusPedido';

describe('proximoStatus', () => {
  it('avança na sequência recebido -> em_preparo -> pronto -> entregue -> finalizado', () => {
    expect(proximoStatus('recebido')).toBe('em_preparo');
    expect(proximoStatus('em_preparo')).toBe('pronto');
    expect(proximoStatus('pronto')).toBe('entregue');
    expect(proximoStatus('entregue')).toBe('finalizado');
  });

  it('finalizado não tem próximo status', () => {
    expect(proximoStatus('finalizado')).toBe(null);
  });
});

describe('rotuloProximaAcao', () => {
  it('adapta o texto do botão pra entrega vs retirada', () => {
    expect(rotuloProximaAcao('recebido', 'entrega')).toBe('Aceitar pedido');
    expect(rotuloProximaAcao('em_preparo', 'entrega')).toBe('Saiu para entrega');
    expect(rotuloProximaAcao('em_preparo', 'retirada')).toBe('Pronto para retirada');
    expect(rotuloProximaAcao('pronto', 'entrega')).toBe('Marcar como entregue');
    expect(rotuloProximaAcao('pronto', 'retirada')).toBe('Marcar como retirado');
    expect(rotuloProximaAcao('entregue', 'entrega')).toBe('Arquivar pedido');
  });

  it('finalizado não tem próxima ação', () => {
    expect(rotuloProximaAcao('finalizado', 'entrega')).toBe(null);
  });
});

describe('tituloCardPedido', () => {
  it('recebido vira "Novo pedido"', () => {
    expect(tituloCardPedido('recebido', 'entrega')).toBe('Novo pedido');
  });

  it('demais status reaproveitam rotuloStatus', () => {
    expect(tituloCardPedido('em_preparo', 'entrega')).toBe(rotuloStatus('em_preparo', 'entrega'));
    expect(tituloCardPedido('pronto', 'retirada')).toBe(rotuloStatus('pronto', 'retirada'));
  });
});
