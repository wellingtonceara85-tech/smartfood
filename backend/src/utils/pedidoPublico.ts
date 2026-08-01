/**
 * Formato mínimo exposto por GET /pedidos/ultimo — usado só pra "Pedir de
 * novo" (reconstruir o carrinho e as preferências de pagamento). Não inclui
 * nome, telefone, endereço, total nem identificadores do pedido: esse
 * endpoint é público e só filtrado por loja+telefone (sem autenticação do
 * cliente), então qualquer campo pessoal devolvido aqui poderia ser obtido
 * por quem simplesmente tentasse números de telefone — ver risco residual
 * documentado no relatório da missão.
 */
export interface PedidoAnteriorPublico {
  itens: unknown;
  formaRecebimento: string;
  bairroEntregaId: string | null;
  formaPagamento: string;
  precisaTroco: boolean | null;
  trocoPara: number | null;
  tipoCartao: string | null;
}

interface PedidoOrigem {
  itens: unknown;
  formaRecebimento: string;
  bairroEntregaId: string | null;
  formaPagamento: string;
  precisaTroco: boolean | null;
  trocoPara: unknown;
  tipoCartao: string | null;
}

/** Projeta um Pedido completo (vindo do banco) no formato mínimo público. */
export function projetarPedidoAnteriorPublico(pedido: PedidoOrigem): PedidoAnteriorPublico {
  return {
    itens: pedido.itens,
    formaRecebimento: pedido.formaRecebimento,
    bairroEntregaId: pedido.bairroEntregaId,
    formaPagamento: pedido.formaPagamento,
    precisaTroco: pedido.precisaTroco,
    trocoPara:
      pedido.trocoPara === null || pedido.trocoPara === undefined ? null : Number(pedido.trocoPara),
    tipoCartao: pedido.tipoCartao,
  };
}
