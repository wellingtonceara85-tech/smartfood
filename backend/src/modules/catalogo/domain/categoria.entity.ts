export interface CriarCategoriaDados {
  empresaId: string;
  nome: string;
  ordem?: number;
}

export interface ReconstituirCategoriaDados {
  id: string;
  empresaId: string;
  nome: string;
  ordem: number;
  criadaEm: Date;
}

/**
 * Aggregate Root Categoria (Missão 0011) — escopada por Empresa, não por Loja (ADR-0018).
 */
export class Categoria {
  private constructor(
    private readonly id: string,
    private readonly empresaId: string,
    private readonly nome: string,
    private readonly ordem: number,
    private readonly criadaEm: Date,
  ) {}

  static criar(dados: CriarCategoriaDados): Categoria {
    if (!dados.nome?.trim()) {
      throw new NomeCategoriaObrigatorioError();
    }

    return new Categoria(
      crypto.randomUUID(),
      dados.empresaId,
      dados.nome.trim(),
      dados.ordem ?? 0,
      new Date(),
    );
  }

  static reconstituir(dados: ReconstituirCategoriaDados): Categoria {
    return new Categoria(dados.id, dados.empresaId, dados.nome, dados.ordem, dados.criadaEm);
  }

  paraPersistencia() {
    return {
      id: this.id,
      empresaId: this.empresaId,
      nome: this.nome,
      ordem: this.ordem,
      criadaEm: this.criadaEm,
    };
  }
}

export class NomeCategoriaObrigatorioError extends Error {
  constructor() {
    super('Nome da Categoria é obrigatório.');
  }
}
