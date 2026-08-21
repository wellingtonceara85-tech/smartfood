interface DadosLojaParaExclusao {
  totalProdutos: number;
  totalPedidos: number;
}

/**
 * Regra de exclusão: só é permitido excluir loja sem operação real. Qualquer
 * loja com produtos ou pedidos deve ser suspensa/arquivada em vez de
 * excluída, pra preservar histórico — validado aqui no backend, nunca só no
 * frontend.
 */
export function lojaElegivelParaExclusao(dados: DadosLojaParaExclusao): boolean {
  return dados.totalProdutos === 0 && dados.totalPedidos === 0;
}
