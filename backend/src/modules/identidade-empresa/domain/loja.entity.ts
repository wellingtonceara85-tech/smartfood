/**
 * Loja — ponto de venda operacional de uma Empresa (Missão 0004, Seção 2).
 * MVP: 1 Loja por Empresa, criada automaticamente (Missão 0006, Seção 2).
 * Filha do Agregado Empresa — nunca criada isoladamente fora de Empresa.criar().
 */
export class Loja {
  private constructor(
    private readonly id: string,
    private readonly empresaId: string,
    private readonly nome: string,
    private readonly criadaEm: Date,
  ) {}

  static criarPadrao(empresaId: string, nomeEmpresa: string): Loja {
    return new Loja(crypto.randomUUID(), empresaId, nomeEmpresa, new Date());
  }

  /** Reidrata uma Loja já existente a partir de dado persistido (Mapper, Infrastructure). */
  static reconstituir(dados: {
    id: string;
    empresaId: string;
    nome: string;
    criadaEm: Date;
  }): Loja {
    return new Loja(dados.id, dados.empresaId, dados.nome, dados.criadaEm);
  }

  paraPersistencia() {
    return {
      id: this.id,
      empresaId: this.empresaId,
      nome: this.nome,
      criadaEm: this.criadaEm,
    };
  }
}
