export class ItemPedidoCozinhaResponseDto {
  id!: string;
  produtoId!: string;
  variacaoId!: string;
  nomeProduto!: string;
  nomeVariacao!: string;
  descricaoProduto!: string | null;
  codigoInternoVariacao!: string | null;
  precoValor!: number;
  precoMoeda!: string;
  quantidade!: number;
}

export class PedidoCozinhaResponseDto {
  id!: string;
  empresaId!: string;
  status!: string;
  criadoEm!: Date;
  itens!: ItemPedidoCozinhaResponseDto[];
}
