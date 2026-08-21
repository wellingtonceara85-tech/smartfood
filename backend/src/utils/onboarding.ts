export interface EtapaOnboarding {
  chave: 'conta_ativada' | 'primeiro_acesso' | 'produtos_cadastrados' | 'primeiro_pedido';
  rotulo: string;
  concluida: boolean;
}

interface DadosOnboarding {
  contaAtivada: boolean;
  primeiroAcesso: boolean;
  totalProdutos: number;
  totalPedidos: number;
}

/** Cada etapa é derivada de dados reais já existentes — nada aqui é estado gravado manualmente. */
export function montarOnboarding(dados: DadosOnboarding): EtapaOnboarding[] {
  return [
    { chave: 'conta_ativada', rotulo: 'Conta ativada', concluida: dados.contaAtivada },
    {
      chave: 'primeiro_acesso',
      rotulo: 'Primeiro acesso realizado',
      concluida: dados.primeiroAcesso,
    },
    {
      chave: 'produtos_cadastrados',
      rotulo: 'Primeiro produto cadastrado',
      concluida: dados.totalProdutos > 0,
    },
    {
      chave: 'primeiro_pedido',
      rotulo: 'Primeiro pedido recebido',
      concluida: dados.totalPedidos > 0,
    },
  ];
}
