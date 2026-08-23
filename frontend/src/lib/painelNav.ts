export interface ItemNavPainel {
  rota: string;
  rotulo: string;
  /** Rótulo curto pra bottom nav mobile, onde o espaço é apertado. */
  rotuloCurto: string;
  icone: string;
}

/**
 * Itens de navegação do painel do lojista — fonte única usada tanto pela
 * sidebar desktop quanto pela bottom nav mobile, pra nunca ficarem
 * desincronizadas.
 */
export const ITENS_NAV_PAINEL: ItemNavPainel[] = [
  { rota: '/painel/dashboard', rotulo: 'Visão geral', rotuloCurto: 'Início', icone: '📊' },
  { rota: '/painel/pedidos', rotulo: 'Pedidos', rotuloCurto: 'Pedidos', icone: '🧾' },
  { rota: '/painel/produtos', rotulo: 'Produtos', rotuloCurto: 'Produtos', icone: '🍔' },
  { rota: '/painel/entrega', rotulo: 'Entrega', rotuloCurto: 'Entrega', icone: '🛵' },
  { rota: '/painel/loja', rotulo: 'Minha loja', rotuloCurto: 'Loja', icone: '🏪' },
];

/** Considera ativo o item cuja rota é prefixo do pathname atual (`/painel/pedidos/123` ainda ativa "Pedidos"). */
export function itemAtivo(pathname: string, rota: string): boolean {
  return pathname === rota || pathname.startsWith(`${rota}/`);
}
