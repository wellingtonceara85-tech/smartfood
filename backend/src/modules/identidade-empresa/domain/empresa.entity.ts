import { Loja } from './loja.entity';

export interface CriarEmpresaDados {
  nome: string;
  cnpjCpf: string;
  categoriaNegocio: string;
  telefone: string;
}

export interface ReconstituirEmpresaDados {
  id: string;
  nome: string;
  cnpjCpf: string;
  categoriaNegocio: string;
  telefone: string;
  chavePix: string | null;
  criadaEm: Date;
}

/**
 * Aggregate Root do Bounded Context Identidade & Empresa (Missão 0009).
 * Empresa é o Tenant (ADR-0002) — raiz de tudo que pertence a uma conta SmartFood.
 */
export class Empresa {
  private constructor(
    private readonly id: string,
    private readonly nome: string,
    private readonly cnpjCpf: string,
    private readonly categoriaNegocio: string,
    private readonly telefone: string,
    private readonly chavePix: string | null,
    private readonly criadaEm: Date,
  ) {}

  /**
   * Única forma de criar uma Empresa — sempre devolve também a Loja padrão
   * na mesma chamada, para que a invariante "toda Empresa nasce com uma Loja"
   * (Missão 0006, Seção 2) seja garantida pelo domínio, não por disciplina do caller.
   */
  static criar(dados: CriarEmpresaDados): { empresa: Empresa; lojaPadrao: Loja } {
    if (!dados.nome?.trim()) {
      throw new NomeObrigatorioError();
    }
    if (!dados.cnpjCpf?.trim()) {
      throw new CnpjCpfObrigatorioError();
    }
    if (!dados.categoriaNegocio?.trim()) {
      throw new CategoriaNegocioObrigatoriaError();
    }
    if (!dados.telefone?.trim()) {
      throw new TelefoneObrigatorioError();
    }

    const empresa = new Empresa(
      crypto.randomUUID(),
      dados.nome.trim(),
      dados.cnpjCpf.trim(),
      dados.categoriaNegocio.trim(),
      dados.telefone.trim(),
      null,
      new Date(),
    );
    const lojaPadrao = Loja.criarPadrao(empresa.id, empresa.nome);

    return { empresa, lojaPadrao };
  }

  /**
   * Reidrata uma Empresa já existente a partir de dados persistidos (Mapper, Infrastructure).
   * Não repete as validações de `criar()` — dado que já passou por elas quando foi gravado.
   */
  static reconstituir(dados: ReconstituirEmpresaDados): Empresa {
    return new Empresa(
      dados.id,
      dados.nome,
      dados.cnpjCpf,
      dados.categoriaNegocio,
      dados.telefone,
      dados.chavePix,
      dados.criadaEm,
    );
  }

  paraPersistencia() {
    return {
      id: this.id,
      nome: this.nome,
      cnpjCpf: this.cnpjCpf,
      categoriaNegocio: this.categoriaNegocio,
      telefone: this.telefone,
      chavePix: this.chavePix,
      criadaEm: this.criadaEm,
    };
  }
}

export class NomeObrigatorioError extends Error {
  constructor() {
    super('Nome da Empresa é obrigatório.');
  }
}

export class CnpjCpfObrigatorioError extends Error {
  constructor() {
    super('CNPJ/CPF da Empresa é obrigatório.');
  }
}

export class CategoriaNegocioObrigatoriaError extends Error {
  constructor() {
    super('Categoria de negócio da Empresa é obrigatória.');
  }
}

export class TelefoneObrigatorioError extends Error {
  constructor() {
    super('Telefone da Empresa é obrigatório.');
  }
}
