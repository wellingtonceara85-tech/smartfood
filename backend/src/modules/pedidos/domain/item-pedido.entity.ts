export interface CriarItemPedidoDados {
  produtoId: string;
  variacaoId: string;
  nomeProduto: string;
  nomeVariacao: string;
  descricaoProduto: string | null;
  codigoInternoVariacao: string | null;
  precoValor: number;
  precoMoeda: string;
  quantidade: number;
}

export interface ReconstituirItemPedidoDados extends CriarItemPedidoDados {
  id: string;
}

/**
 * Snapshot completo e imutável de um item vendido (ADR-0003) — nome, descrição, SKU e preço
 * são copiados do Catálogo no momento da criação do Pedido e nunca mais mudam, mesmo que o
 * Produto original mude ou deixe de existir. `produtoId`/`variacaoId` são só referência
 * histórica, sem FK (cruza Bounded Context, ADR-0016/0022).
 */
export class ItemPedido {
  private constructor(
    private readonly id: string,
    private readonly produtoId: string,
    private readonly variacaoId: string,
    private readonly nomeProduto: string,
    private readonly nomeVariacao: string,
    private readonly descricaoProduto: string | null,
    private readonly codigoInternoVariacao: string | null,
    private readonly precoValor: number,
    private readonly precoMoeda: string,
    private readonly quantidade: number,
  ) {}

  static criar(dados: CriarItemPedidoDados): ItemPedido {
    if (!dados.quantidade || dados.quantidade <= 0) {
      throw new QuantidadeItemInvalidaError();
    }

    return new ItemPedido(
      crypto.randomUUID(),
      dados.produtoId,
      dados.variacaoId,
      dados.nomeProduto,
      dados.nomeVariacao,
      dados.descricaoProduto,
      dados.codigoInternoVariacao,
      dados.precoValor,
      dados.precoMoeda,
      dados.quantidade,
    );
  }

  static reconstituir(dados: ReconstituirItemPedidoDados): ItemPedido {
    return new ItemPedido(
      dados.id,
      dados.produtoId,
      dados.variacaoId,
      dados.nomeProduto,
      dados.nomeVariacao,
      dados.descricaoProduto,
      dados.codigoInternoVariacao,
      dados.precoValor,
      dados.precoMoeda,
      dados.quantidade,
    );
  }

  subtotal(): number {
    return this.precoValor * this.quantidade;
  }

  paraPersistencia() {
    return {
      id: this.id,
      produtoId: this.produtoId,
      variacaoId: this.variacaoId,
      nomeProduto: this.nomeProduto,
      nomeVariacao: this.nomeVariacao,
      descricaoProduto: this.descricaoProduto,
      codigoInternoVariacao: this.codigoInternoVariacao,
      precoValor: this.precoValor,
      precoMoeda: this.precoMoeda,
      quantidade: this.quantidade,
    };
  }
}

export class QuantidadeItemInvalidaError extends Error {
  constructor() {
    super('Quantidade do Item do Pedido precisa ser maior que zero.');
  }
}
