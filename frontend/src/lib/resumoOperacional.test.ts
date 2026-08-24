import { describe, expect, it } from 'vitest';
import { resumoOperacional } from './resumoOperacional';

describe('resumoOperacional', () => {
  it('pedidos aguardando atenção têm prioridade sobre o estado da loja', () => {
    const resultado = resumoOperacional({ aberto: false, pedidosPrecisandoAtencao: 2 });
    expect(resultado.icone).toBe('🟠');
    expect(resultado.mensagem).toBe('2 pedidos precisam da sua atenção.');
  });

  it('singular quando é só 1 pedido', () => {
    const resultado = resumoOperacional({ aberto: true, pedidosPrecisandoAtencao: 1 });
    expect(resultado.mensagem).toBe('1 pedido precisa da sua atenção.');
  });

  it('loja aberta sem pendências', () => {
    const resultado = resumoOperacional({ aberto: true, pedidosPrecisandoAtencao: 0 });
    expect(resultado.icone).toBe('🟢');
    expect(resultado.mensagem).toContain('aberta');
  });

  it('loja fechada sem pendências', () => {
    const resultado = resumoOperacional({ aberto: false, pedidosPrecisandoAtencao: 0 });
    expect(resultado.icone).toBe('🔴');
    expect(resultado.mensagem).toContain('fechada');
  });

  it('não recalcula a regra de aberto/fechado — só reflete o que recebeu', () => {
    // aberto=true vindo de fora é respeitado mesmo sem checar horário nenhum aqui dentro.
    expect(resumoOperacional({ aberto: true, pedidosPrecisandoAtencao: 0 }).icone).toBe('🟢');
    expect(resumoOperacional({ aberto: false, pedidosPrecisandoAtencao: 0 }).icone).toBe('🔴');
  });
});
