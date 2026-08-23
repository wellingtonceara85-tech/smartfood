import { describe, expect, it } from 'vitest';
import { itemAtivo, ITENS_NAV_PAINEL } from './painelNav';

describe('itemAtivo', () => {
  it('rota exata é ativa', () => {
    expect(itemAtivo('/painel/pedidos', '/painel/pedidos')).toBe(true);
  });

  it('sub-rota é ativa (prefixo)', () => {
    expect(itemAtivo('/painel/pedidos/123', '/painel/pedidos')).toBe(true);
  });

  it('rota de outro item não é ativa', () => {
    expect(itemAtivo('/painel/produtos', '/painel/pedidos')).toBe(false);
  });

  it('não confunde prefixos parecidos sem separador', () => {
    expect(itemAtivo('/painel/pedidosx', '/painel/pedidos')).toBe(false);
  });
});

describe('ITENS_NAV_PAINEL', () => {
  it('tem exatamente os 5 destinos da missão, sem duplicar rotas', () => {
    expect(ITENS_NAV_PAINEL).toHaveLength(5);
    const rotas = ITENS_NAV_PAINEL.map((i) => i.rota);
    expect(new Set(rotas).size).toBe(rotas.length);
  });
});
