import { CriarVariacaoDados, ReconstituirVariacaoDados, Variacao } from './variacao.entity';

export interface CriarProdutoDados {
  lojaId: string;
  categoriaId: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  controlaEstoque?: boolean;
  primeiraVariacao: CriarVariacaoDados;
}

export interface ReconstituirProdutoDados {
  id: string;
  lojaId: string;
  categoriaId: string;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  controlaEstoque: boolean;
  disponivel: boolean;
  criadoEm: Date;
  variacoes: ReconstituirVariacaoDados[];
}

/**
 * Aggregate Root Produto (Missão 0011) — escopado por Loja, não por Empresa (ADR-0018).
 * Contém as Variações — nenhum outro código muda uma Variação fora deste Agregado.
 *
 * Invariante 1: nasce sempre com pelo menos uma Variação (mesmo padrão de Empresa/Loja, Missão 0009).
 * Invariante 2: nunca fica `disponivel = true` se nenhuma Variação estiver disponível.
 */
export class Produto {
  private constructor(
    private readonly id: string,
    private readonly lojaId: string,
    private readonly categoriaId: string,
    private readonly nome: string,
    private readonly descricao: string | null,
    private readonly imagemUrl: string | null,
    private readonly controlaEstoque: boolean,
    private disponivel: boolean,
    private readonly criadoEm: Date,
    private readonly variacoes: Variacao[],
  ) {}

  static criar(dados: CriarProdutoDados): Produto {
    if (!dados.nome?.trim()) {
      throw new NomeProdutoObrigatorioError();
    }
    if (!dados.categoriaId) {
      throw new CategoriaObrigatoriaError();
    }

    const produtoId = crypto.randomUUID();
    const primeiraVariacao = Variacao.criar(produtoId, dados.primeiraVariacao);

    return new Produto(
      produtoId,
      dados.lojaId,
      dados.categoriaId,
      dados.nome.trim(),
      dados.descricao?.trim() ?? null,
      dados.imagemUrl ?? null,
      dados.controlaEstoque ?? false,
      true,
      new Date(),
      [primeiraVariacao],
    );
  }

  static reconstituir(dados: ReconstituirProdutoDados): Produto {
    const variacoes = dados.variacoes.map((v) => Variacao.reconstituir(v));
    return new Produto(
      dados.id,
      dados.lojaId,
      dados.categoriaId,
      dados.nome,
      dados.descricao,
      dados.imagemUrl,
      dados.controlaEstoque,
      dados.disponivel,
      dados.criadoEm,
      variacoes,
    );
  }

  private temVariacaoDisponivel(): boolean {
    return this.variacoes.some((v) => v.estaDisponivel());
  }

  /** Invariante 2 — rejeita ligar se nenhuma Variação estiver disponível. */
  ligarDisponibilidade(): void {
    if (!this.temVariacaoDisponivel()) {
      throw new ProdutoSemVariacaoDisponivelError();
    }
    this.disponivel = true;
  }

  desligarDisponibilidade(): void {
    this.disponivel = false;
  }

  alternarDisponibilidade(): void {
    if (this.disponivel) {
      this.desligarDisponibilidade();
    } else {
      this.ligarDisponibilidade();
    }
  }

  /** Alterna uma Variação específica e cascateia a Invariante 2 (Missão 0011, Seção 2). */
  alternarDisponibilidadeVariacao(variacaoId: string): void {
    const variacao = this.variacoes.find((v) => v.paraPersistencia().id === variacaoId);
    if (!variacao) {
      throw new VariacaoNaoEncontradaError(variacaoId);
    }

    variacao.alternarDisponibilidade();

    if (!this.temVariacaoDisponivel()) {
      this.disponivel = false;
    }
  }

  paraPersistencia() {
    return {
      id: this.id,
      lojaId: this.lojaId,
      categoriaId: this.categoriaId,
      nome: this.nome,
      descricao: this.descricao,
      imagemUrl: this.imagemUrl,
      controlaEstoque: this.controlaEstoque,
      disponivel: this.disponivel,
      criadoEm: this.criadoEm,
      variacoes: this.variacoes.map((v) => v.paraPersistencia()),
    };
  }
}

export class NomeProdutoObrigatorioError extends Error {
  constructor() {
    super('Nome do Produto é obrigatório.');
  }
}

export class CategoriaObrigatoriaError extends Error {
  constructor() {
    super('Produto precisa pertencer a uma Categoria.');
  }
}

export class ProdutoSemVariacaoDisponivelError extends Error {
  constructor() {
    super('Produto não pode ficar disponível sem nenhuma Variação disponível.');
  }
}

export class VariacaoNaoEncontradaError extends Error {
  constructor(variacaoId: string) {
    super(`Variação "${variacaoId}" não pertence a este Produto.`);
  }
}
