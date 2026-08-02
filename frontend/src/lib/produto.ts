/**
 * Um produto é "configurável" quando tem opções cadastradas (Produto.opcoes)
 * — nesse caso o "+" abre o modal de personalização em vez de adicionar
 * direto. Reaproveita o mesmo campo que já existia antes desta missão, sem
 * criar uma coluna nova só pra marcar "produto configurável".
 */
export function produtoConfiguravel(produto: { opcoes: string[] | null }): boolean {
  return Boolean(produto.opcoes && produto.opcoes.length > 0);
}
