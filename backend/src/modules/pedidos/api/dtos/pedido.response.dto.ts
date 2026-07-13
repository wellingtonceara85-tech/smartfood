export class ItemPedidoResponseDto {
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

export class EnderecoEntregaResponseDto {
  rua!: string;
  numero!: string;
  bairro!: string;
  cidade!: string;
  cep!: string;
  complemento?: string | null;
}

export class PedidoResponseDto {
  id!: string;
  empresaId!: string;
  clienteId!: string | null;
  criadoPorUsuarioId!: string;
  canalVenda!: string;
  status!: string;
  valorTotal!: number;
  enderecoEntrega!: EnderecoEntregaResponseDto | null;
  criadoEm!: Date;
  itens!: ItemPedidoResponseDto[];
}
