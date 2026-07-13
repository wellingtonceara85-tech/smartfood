import { ehPapelValido, PapelNome } from './papel';

export interface CriarUsuarioDados {
  empresaId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: string;
}

export interface ReconstituirUsuarioDados {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: PapelNome;
  criadoEm: Date;
}

/**
 * Aggregate Root Usuário (Missão 0010) — equipe interna, sempre escopado por Empresa
 * (Missão 0004, Invariante 4). Nunca confundir com Cliente (identidade global, ADR-0017).
 */
export class Usuario {
  private constructor(
    private readonly id: string,
    private readonly empresaId: string,
    private readonly nome: string,
    private readonly email: string,
    private readonly senhaHash: string,
    private readonly papel: PapelNome,
    private readonly criadoEm: Date,
  ) {}

  /**
   * `senhaHash` já vem pronto (hash gerado pelo `PasswordHasher` na Application) — Domain
   * nunca importa biblioteca de criptografia (Missão 0007.5, Seção 4.1).
   */
  static criar(dados: CriarUsuarioDados): Usuario {
    if (!dados.nome?.trim()) {
      throw new NomeObrigatorioError();
    }
    if (!dados.email?.trim() || !dados.email.includes('@')) {
      throw new EmailInvalidoError();
    }
    if (!dados.senhaHash) {
      throw new SenhaObrigatoriaError();
    }
    if (!ehPapelValido(dados.papel)) {
      throw new PapelInvalidoError(dados.papel);
    }

    return new Usuario(
      crypto.randomUUID(),
      dados.empresaId,
      dados.nome.trim(),
      dados.email.trim().toLowerCase(),
      dados.senhaHash,
      dados.papel,
      new Date(),
    );
  }

  static reconstituir(dados: ReconstituirUsuarioDados): Usuario {
    return new Usuario(
      dados.id,
      dados.empresaId,
      dados.nome,
      dados.email,
      dados.senhaHash,
      dados.papel,
      dados.criadoEm,
    );
  }

  paraPersistencia() {
    return {
      id: this.id,
      empresaId: this.empresaId,
      nome: this.nome,
      email: this.email,
      senhaHash: this.senhaHash,
      papel: this.papel,
      criadoEm: this.criadoEm,
    };
  }
}

export class NomeObrigatorioError extends Error {
  constructor() {
    super('Nome do Usuário é obrigatório.');
  }
}

export class EmailInvalidoError extends Error {
  constructor() {
    super('E-mail do Usuário é obrigatório e precisa ser válido.');
  }
}

export class SenhaObrigatoriaError extends Error {
  constructor() {
    super('Senha do Usuário é obrigatória.');
  }
}

export class PapelInvalidoError extends Error {
  constructor(papel: string) {
    super(`Papel "${papel}" não é um papel interno válido.`);
  }
}
