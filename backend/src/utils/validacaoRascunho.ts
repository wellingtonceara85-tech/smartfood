export interface RascunhoProdutoResumo {
  id: string;
  nome: string | null;
  descricao: string | null;
  preco: number | null;
  fotoUrl: string | null;
  publicado: boolean;
}

export interface ResumoRascunho {
  totalProdutos: number;
  totalCategorias: number;
  duplicados: number;
  semDescricao: number;
  semFoto: number;
  precisaRevisao: number;
  publicaveis: number;
}

/** Nome normalizado (sem acento/caixa) só pra detectar duplicidade — nunca usado como o nome de fato. */
function normalizarNome(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/**
 * Um item do rascunho só pode ser publicado com nome e preço válidos —
 * mesmo critério usado no publish (`podePublicar`) e no resumo da tela de
 * revisão, pra nunca divergir entre "o que está travando" e "o que o
 * lojista vê".
 */
export function podePublicar(item: Pick<RascunhoProdutoResumo, 'nome' | 'preco'>): boolean {
  return !!item.nome?.trim() && item.preco !== null && item.preco > 0;
}

/** Conta duplicados por nome normalizado — cada item além do primeiro de um grupo repetido conta como duplicado. */
function contarDuplicados(itens: RascunhoProdutoResumo[]): number {
  const contagemPorNome = new Map<string, number>();
  for (const item of itens) {
    if (!item.nome) continue;
    const chave = normalizarNome(item.nome);
    contagemPorNome.set(chave, (contagemPorNome.get(chave) ?? 0) + 1);
  }
  let duplicados = 0;
  for (const total of contagemPorNome.values()) {
    if (total > 1) duplicados += total - 1;
  }
  return duplicados;
}

export function montarResumoRascunho(
  itens: RascunhoProdutoResumo[],
  totalCategorias: number,
): ResumoRascunho {
  const pendentes = itens.filter((i) => !i.publicado);

  return {
    totalProdutos: pendentes.length,
    totalCategorias,
    duplicados: contarDuplicados(pendentes),
    semDescricao: pendentes.filter((i) => !i.descricao?.trim()).length,
    semFoto: pendentes.filter((i) => !i.fotoUrl).length,
    precisaRevisao: pendentes.filter((i) => !podePublicar(i)).length,
    publicaveis: pendentes.filter(podePublicar).length,
  };
}

/** IDs (dentre os informados) que marcam duplicidade de nome — usado pra sinalizar na tela de revisão quais itens colidem. */
export function idsPossivelmenteDuplicados(itens: RascunhoProdutoResumo[]): Set<string> {
  const porNome = new Map<string, string[]>();
  for (const item of itens) {
    if (!item.nome || item.publicado) continue;
    const chave = normalizarNome(item.nome);
    porNome.set(chave, [...(porNome.get(chave) ?? []), item.id]);
  }
  const duplicados = new Set<string>();
  for (const ids of porNome.values()) {
    if (ids.length > 1) ids.forEach((id) => duplicados.add(id));
  }
  return duplicados;
}
