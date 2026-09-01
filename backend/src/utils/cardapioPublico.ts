/**
 * Monta a visão pública do cardápio (o que o cliente vê em GET
 * /public/lojas/:slug) a partir do estado bruto de categorias/produtos/
 * grupos do painel do lojista.
 *
 * Regra central desta missão: produto INATIVO nunca aparece pro consumidor
 * (nem apagado, nem em nenhuma superfície pública) — só some da resposta,
 * nunca é excluído/alterado no banco. Categoria sem nenhum produto visível
 * (todos inativos, ou nunca teve produto) também não aparece — mas continua
 * existindo normalmente pro lojista. Grupos/opções inativos de um produto
 * seguem a mesma regra: somem da resposta pública, mas continuam no painel.
 *
 * Função pura de propósito — sem Prisma/Express — pra ser testável sem banco.
 */

export interface OpcaoGrupoBruta {
  id: string;
  nome: string;
  precoAdicional: number;
  ativo: boolean;
  ordem: number;
}

export interface GrupoOpcoesBruto {
  id: string;
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  ativo: boolean;
  ordem: number;
  opcoes: OpcaoGrupoBruta[];
}

export interface ProdutoBruto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  fotoUrl: string | null;
  disponivel: boolean;
  opcoes: string[] | null;
  gruposOpcoes: GrupoOpcoesBruto[];
}

export interface CategoriaBruta {
  id: string;
  nome: string;
  ordem: number;
  produtos: ProdutoBruto[];
}

export interface OpcaoGrupoPublica {
  id: string;
  nome: string;
  precoAdicional: number;
  // Sempre true aqui — opções inativas já foram removidas da lista. Mantido
  // no payload (em vez de omitido) pra bater com o mesmo formato usado no
  // painel do lojista (GrupoOpcoesProduto/OpcaoGrupoProduto em types.ts).
  ativo: true;
  ordem: number;
}

export interface GrupoOpcoesPublico {
  id: string;
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  ativo: true;
  ordem: number;
  opcoes: OpcaoGrupoPublica[];
}

export interface ProdutoPublico {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  fotoUrl: string | null;
  disponivel: boolean;
  opcoes: string[] | null;
  gruposOpcoes: GrupoOpcoesPublico[];
}

export interface CategoriaPublica {
  id: string;
  nome: string;
  ordem: number;
  produtos: ProdutoPublico[];
}

function montarProdutoPublico(produto: ProdutoBruto): ProdutoPublico {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    preco: produto.preco,
    fotoUrl: produto.fotoUrl,
    disponivel: produto.disponivel,
    opcoes: produto.opcoes,
    gruposOpcoes: produto.gruposOpcoes
      .filter((grupo) => grupo.ativo)
      .map((grupo) => ({
        id: grupo.id,
        nome: grupo.nome,
        minEscolhas: grupo.minEscolhas,
        maxEscolhas: grupo.maxEscolhas,
        obrigatorio: grupo.obrigatorio,
        ativo: true as const,
        ordem: grupo.ordem,
        opcoes: grupo.opcoes
          .filter((opcao) => opcao.ativo)
          .map((opcao) => ({
            id: opcao.id,
            nome: opcao.nome,
            precoAdicional: opcao.precoAdicional,
            ativo: true as const,
            ordem: opcao.ordem,
          })),
      })),
  };
}

/** Filtra produtos indisponíveis e remove categorias que ficaram sem nenhum produto visível. */
export function montarCategoriasPublicas(categorias: CategoriaBruta[]): CategoriaPublica[] {
  return categorias
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      ordem: categoria.ordem,
      produtos: categoria.produtos
        .filter((produto) => produto.disponivel)
        .map(montarProdutoPublico),
    }))
    .filter((categoria) => categoria.produtos.length > 0);
}
