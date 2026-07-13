export interface CriarProdutoCommand {
  /** Empresa do chamador autenticado — usado para resolver a Loja (Missão 0011, Seção "problema do lojaId"). */
  empresaId: string;
  categoriaId: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  controlaEstoque?: boolean;
  primeiraVariacao: {
    nome: string;
    precoValor: number;
    precoMoeda?: string;
  };
}
