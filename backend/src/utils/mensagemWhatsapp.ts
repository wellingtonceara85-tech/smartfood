interface ItemMensagem {
  nome: string;
  opcao?: string | null;
  quantidade: number;
  subtotal: number;
}

interface RecebimentoMensagem {
  forma: 'entrega' | 'retirada';
  bairroNome?: string | null;
  valorEntrega?: number;
}

interface PedidoMensagem {
  numero: number;
  clienteNome: string;
  clienteTelefone: string;
  formaPagamento: string;
  precisaTroco: boolean;
  trocoPara: number | null;
  tipoCartao: string | null;
  chavePix: string | null;
  linkAcompanhamento: string;
}

const moeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

const LABEL_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'Pix',
};

export function montarMensagemPedido(
  nomeLoja: string,
  itens: ItemMensagem[],
  total: number,
  recebimento: RecebimentoMensagem,
  pedido: PedidoMensagem,
): string {
  // *texto* é a sintaxe de negrito do WhatsApp (não é markdown/HTML) — usado só
  // nos destaques (nome da loja, itens e total), o resto fica em texto normal.
  const linhas = [
    `*Pedido - ${nomeLoja}*`,
    '',
    `Meu nome é ${pedido.clienteNome}, Contato: ${pedido.clienteTelefone}`,
    '',
    `Código do pedido: #${pedido.numero}`,
    '',
  ];

  for (const item of itens) {
    const descricaoOpcao = item.opcao ? ` (${item.opcao})` : '';
    linhas.push(`*${item.quantidade}x ${item.nome}${descricaoOpcao}* - ${moeda(item.subtotal)}`);
  }

  const linhaRecebimento =
    recebimento.forma === 'entrega'
      ? `Forma de recebimento: Entrega - ${recebimento.bairroNome} (${moeda(recebimento.valorEntrega ?? 0)})`
      : 'Forma de recebimento: Retirada no local';

  let detalhePagamento = LABEL_PAGAMENTO[pedido.formaPagamento] ?? pedido.formaPagamento;
  if (pedido.formaPagamento === 'dinheiro') {
    detalhePagamento = pedido.precisaTroco
      ? `Dinheiro (troco para ${moeda(pedido.trocoPara ?? 0)})`
      : 'Dinheiro (sem troco)';
  } else if (pedido.formaPagamento === 'cartao') {
    detalhePagamento = `Cartão - ${pedido.tipoCartao === 'credito' ? 'Crédito' : 'Débito'}`;
  }
  const linhaPagamento = `Pagamento em: ${detalhePagamento}`;

  linhas.push('', linhaRecebimento, linhaPagamento);

  if (pedido.formaPagamento === 'pix' && pedido.chavePix) {
    linhas.push(`Chave Pix da loja: ${pedido.chavePix}`);
  }

  linhas.push(
    '',
    `*Total: ${moeda(total)}*`,
    '',
    `Acompanhe seu pedido: ${pedido.linkAcompanhamento}`,
  );

  return linhas.join('\n');
}
