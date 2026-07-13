export interface CriarPedidoItemCommand {
  produtoId: string;
  variacaoId: string;
  quantidade: number;
}

export interface CriarPedidoCommand {
  empresaId: string;
  criadoPorUsuarioId: string;
  canalVenda: string;
  clienteId?: string;
  enderecoEntrega?: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    cep: string;
    complemento?: string;
  };
  itens: CriarPedidoItemCommand[];
}
