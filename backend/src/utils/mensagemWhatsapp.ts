interface ItemMensagem {
  nome: string;
  opcao?: string | null;
  quantidade: number;
  subtotal: number;
}

const moeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

export function montarMensagemPedido(
  nomeLoja: string,
  itens: ItemMensagem[],
  total: number,
): string {
  const linhas = [`Pedido - ${nomeLoja}`, ''];

  for (const item of itens) {
    const descricaoOpcao = item.opcao ? ` (${item.opcao})` : '';
    linhas.push(`${item.quantidade}x ${item.nome}${descricaoOpcao} - ${moeda(item.subtotal)}`);
  }

  linhas.push('', `Total: ${moeda(total)}`);

  return linhas.join('\n');
}
