/**
 * Um produto é "configurável" quando tem opções cadastradas (Produto.opcoes)
 * — nesse caso o "+" abre o modal de personalização em vez de adicionar
 * direto. Reaproveita o mesmo campo que já existia antes desta missão, sem
 * criar uma coluna nova só pra marcar "produto configurável".
 */
export function produtoConfiguravel(produto: { opcoes: string[] | null }): boolean {
  return Boolean(produto.opcoes && produto.opcoes.length > 0);
}

/**
 * Rótulo curto pra sinalizar na listagem que o produto está sem foto e/ou
 * descrição — não bloqueia nada, é só um indicador discreto (mesmo critério
 * usado no backend pra montar as pendências do dashboard).
 */
export function rotuloProdutoIncompleto(produto: {
  fotoUrl: string | null;
  descricao: string | null;
}): string | null {
  const semFoto = !produto.fotoUrl;
  const semDescricao = !produto.descricao || produto.descricao.trim() === '';
  if (semFoto && semDescricao) return 'Sem foto e descrição';
  if (semFoto) return 'Sem foto';
  if (semDescricao) return 'Sem descrição';
  return null;
}
