interface ProdutoResumoPendencia {
  fotoUrl: string | null;
  descricao: string | null;
}

/** Mesmo critério usado na listagem do painel pra sinalizar o produto — nome, foto e descrição em branco contam como ausentes. */
export function produtoIncompleto(produto: ProdutoResumoPendencia): boolean {
  return !produto.fotoUrl || !produto.descricao || produto.descricao.trim() === '';
}

interface DadosPendenciasLoja {
  produtos: ProdutoResumoPendencia[];
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
  logoUrl: string | null;
  endereco: string | null;
}

export interface Pendencia {
  chave: string;
  titulo: string;
  descricao: string;
  rota: string;
}

/**
 * Pendências calculadas a partir do estado real da loja — sem checklist
 * manual, sem flag de "concluído" persistida: some sozinha quando o dado é
 * preenchido. Cada critério aqui espelha exatamente o que o resto do sistema
 * já trata como "não configurado" (ver `calcularAberto` em `horario.ts`),
 * pra não sinalizar falso positivo:
 * - `corPrimaria`, `corSecundaria`, `aceitaAgendamento` etc. têm valor
 *   default no schema desde a criação da loja — nunca contam como pendência.
 * - horário só é pendência se NEM horário NEM status manual estiverem
 *   configurados: se o lojista já força aberto/fechado manualmente, a
 *   ausência de horário é irrelevante pro que o cliente vê.
 */
export function montarPendenciasLoja(dados: DadosPendenciasLoja): Pendencia[] {
  const pendencias: Pendencia[] = [];

  const semHorarioEModoAutomatico =
    (!dados.horarioAbertura || !dados.horarioFechamento) && dados.abertoManual == null;
  if (semHorarioEModoAutomatico) {
    pendencias.push({
      chave: 'horario_funcionamento',
      titulo: 'Horário de funcionamento não configurado',
      descricao: 'Sem horário nem status manual definidos, o cardápio aparece sempre como aberto.',
      rota: '/painel/loja',
    });
  }

  const produtosIncompletos = dados.produtos.filter(produtoIncompleto).length;
  if (produtosIncompletos > 0) {
    pendencias.push({
      chave: 'produtos_incompletos',
      titulo:
        produtosIncompletos === 1
          ? '1 produto sem foto ou descrição'
          : `${produtosIncompletos} produtos sem foto ou descrição`,
      descricao: 'Fotos e descrições deixam o cardápio mais atrativo e ajudam o cliente a decidir.',
      rota: '/painel/produtos',
    });
  }

  const semLogo = !dados.logoUrl;
  const semEndereco = !dados.endereco;
  if (semLogo || semEndereco) {
    let titulo: string;
    if (semLogo && semEndereco) {
      titulo = 'Adicione a logo e o endereço da sua loja';
    } else if (semLogo) {
      titulo = 'Adicione a logo da sua loja';
    } else {
      titulo = 'Adicione o endereço da sua loja';
    }
    pendencias.push({
      chave: 'dados_essenciais',
      titulo,
      descricao: 'Ajudam o cliente a reconhecer e confiar na sua loja.',
      rota: '/painel/loja',
    });
  }

  return pendencias;
}
