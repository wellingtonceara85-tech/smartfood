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

const moeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

export function montarMensagemPedido(
  nomeLoja: string,
  itens: ItemMensagem[],
  total: number,
  recebimento: RecebimentoMensagem,
): string {
  // *texto* é a sintaxe de negrito do WhatsApp (não é markdown/HTML) — usado só
  // nos destaques (nome da loja, itens e total), o resto fica em texto normal.
  const linhas = [`*Pedido - ${nomeLoja}*`, ''];

  for (const item of itens) {
    const descricaoOpcao = item.opcao ? ` (${item.opcao})` : '';
    linhas.push(`*${item.quantidade}x ${item.nome}${descricaoOpcao}* - ${moeda(item.subtotal)}`);
  }

  const linhaRecebimento =
    recebimento.forma === 'entrega'
      ? `Forma de recebimento: Entrega - ${recebimento.bairroNome} (${moeda(recebimento.valorEntrega ?? 0)})`
      : 'Forma de recebimento: Retirada no local';

  linhas.push('', linhaRecebimento, '', `*Total: ${moeda(total)}*`);

  return linhas.join('\n');
}
