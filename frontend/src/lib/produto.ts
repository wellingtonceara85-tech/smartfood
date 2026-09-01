/**
 * Um produto é "configurável" quando tem opções cadastradas — seja pelo
 * mecanismo legado (Produto.opcoes) ou pelo novo (grupos de opções, com pelo
 * menos um grupo ativo) — nesse caso o "+" abre o modal de personalização em
 * vez de adicionar direto.
 */
export function produtoConfiguravel(produto: {
  opcoes: string[] | null;
  gruposOpcoes?: { ativo: boolean }[];
}): boolean {
  return Boolean(
    (produto.opcoes && produto.opcoes.length > 0) ||
    produto.gruposOpcoes?.some((grupo) => grupo.ativo),
  );
}

/**
 * Decide se o cardápio público deve mostrar o seletor legado "Opções" (lista
 * simples, escolha única) de um produto. As duas formas de personalização
 * nunca aparecem juntas pro cliente — geraria redundância visual e escolhas
 * contraditórias — mas o campo legado nunca é apagado: ele só fica em espera
 * enquanto o produto tiver pelo menos um Grupo de Opções ativo, e volta
 * automaticamente assim que todos os grupos forem desativados (sem precisar
 * editar nada no formulário simples).
 */
export function deveUsarOpcoesLegado(produto: {
  opcoes: string[] | null;
  gruposOpcoes?: { ativo: boolean }[];
}): boolean {
  const temOpcoesLegado = Boolean(produto.opcoes && produto.opcoes.length > 0);
  const temGrupoAtivo = Boolean(produto.gruposOpcoes?.some((grupo) => grupo.ativo));
  return temOpcoesLegado && !temGrupoAtivo;
}

/**
 * Rótulo curto da regra de escolha de um grupo, na linguagem do cliente
 * (nunca "min/max"): "Escolha 1", "Escolha até 3", "Escolha de 1 a 3" ou
 * "Opcional" quando não há de fato nenhum limite relevante (grupo opcional
 * cujo máximo cobre todas as opções, ex: "Deseja retirar algo?").
 */
export function rotuloRegraEscolha(
  grupo: { minEscolhas: number; maxEscolhas: number },
  totalOpcoes: number,
): string {
  const semLimiteReal = grupo.maxEscolhas >= totalOpcoes;
  if (grupo.minEscolhas <= 0) {
    return semLimiteReal ? 'Opcional' : `Escolha até ${grupo.maxEscolhas}`;
  }
  if (grupo.minEscolhas === grupo.maxEscolhas) {
    return `Escolha ${grupo.minEscolhas}`;
  }
  return `Escolha de ${grupo.minEscolhas} a ${grupo.maxEscolhas}`;
}

/**
 * Chave estável de um item do carrinho — inclui produto, opção legada,
 * grupos selecionados (por id de opção, ordenado, pra não depender da ordem
 * de clique) e observação. Duas configurações diferentes do mesmo produto
 * nunca se fundem silenciosamente num item só.
 */
export function chaveItemCarrinho(
  produtoId: string,
  opcao: string | null,
  gruposSelecionados: { grupoId: string; opcoes: { id: string }[] }[],
  observacao: string | null,
): string {
  const gruposOrdenados = [...gruposSelecionados]
    .map((g) => ({ grupoId: g.grupoId, opcaoIds: g.opcoes.map((o) => o.id).sort() }))
    .sort((a, b) => a.grupoId.localeCompare(b.grupoId));
  const gruposTexto = gruposOrdenados.map((g) => `${g.grupoId}:${g.opcaoIds.join('+')}`).join('|');
  return `${produtoId}-${opcao ?? ''}-${gruposTexto}-${observacao ?? ''}`;
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

export interface GrupoProdutosPorCategoria<C, P> {
  categoria: C;
  produtos: P[];
}

/**
 * Agrupa os produtos por categoria, na mesma ordem em que as categorias já
 * vêm (o lojista controla essa ordem arrastando) — e dentro de cada grupo,
 * ordena pelo campo `ordem` do produto. Produto sem categoria correspondente
 * na lista (categoria excluída, por exemplo) simplesmente não aparece —
 * nunca quebra a tela.
 */
export function agruparProdutosPorCategoria<
  C extends { id: string },
  P extends { categoriaId: string; ordem: number },
>(categorias: C[], produtos: P[]): GrupoProdutosPorCategoria<C, P>[] {
  return categorias.map((categoria) => ({
    categoria,
    produtos: produtos
      .filter((produto) => produto.categoriaId === categoria.id)
      .sort((a, b) => a.ordem - b.ordem),
  }));
}
