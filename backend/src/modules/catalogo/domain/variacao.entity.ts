export interface CriarVariacaoDados {
  nome: string;
  precoValor: number;
  precoMoeda?: string;
  codigoInterno?: string;
}

export interface ReconstituirVariacaoDados {
  id: string;
  produtoId: string;
  nome: string;
  precoValor: number;
  precoMoeda: string;
  codigoInterno: string | null;
  disponivel: boolean;
}

/**
 * Variação de um Produto (Missão 0004, Seção 2) — opção com preço e disponibilidade próprios.
 * Filha do Agregado Produto — nunca criada ou alternada isoladamente fora dele.
 */
export class Variacao {
  private constructor(
    private readonly id: string,
    private readonly produtoId: string,
    private readonly nome: string,
    private readonly precoValor: number,
    private readonly precoMoeda: string,
    private readonly codigoInterno: string | null,
    private disponivel: boolean,
  ) {}

  static criar(produtoId: string, dados: CriarVariacaoDados): Variacao {
    if (!dados.nome?.trim()) {
      throw new NomeVariacaoObrigatorioError();
    }
    if (dados.precoValor === undefined || dados.precoValor === null || dados.precoValor < 0) {
      throw new PrecoVariacaoInvalidoError();
    }

    return new Variacao(
      crypto.randomUUID(),
      produtoId,
      dados.nome.trim(),
      dados.precoValor,
      dados.precoMoeda ?? 'BRL',
      dados.codigoInterno?.trim() ?? null,
      true,
    );
  }

  static reconstituir(dados: ReconstituirVariacaoDados): Variacao {
    return new Variacao(
      dados.id,
      dados.produtoId,
      dados.nome,
      dados.precoValor,
      dados.precoMoeda,
      dados.codigoInterno,
      dados.disponivel,
    );
  }

  alternarDisponibilidade(): void {
    this.disponivel = !this.disponivel;
  }

  estaDisponivel(): boolean {
    return this.disponivel;
  }

  paraPersistencia() {
    return {
      id: this.id,
      produtoId: this.produtoId,
      nome: this.nome,
      precoValor: this.precoValor,
      precoMoeda: this.precoMoeda,
      codigoInterno: this.codigoInterno,
      disponivel: this.disponivel,
    };
  }
}

export class NomeVariacaoObrigatorioError extends Error {
  constructor() {
    super('Nome da Variação é obrigatório.');
  }
}

export class PrecoVariacaoInvalidoError extends Error {
  constructor() {
    super('Preço da Variação é obrigatório e não pode ser negativo.');
  }
}
