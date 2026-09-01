/**
 * Modelos/sugestões de Grupos de Opções por segmento de negócio — mesmo
 * padrão arquitetural de CATEGORIAS_SUGERIDAS_POR_SEGMENTO em
 * utils/segmentoLoja.ts (função pura, sem persistência, chaveada pelo mesmo
 * `segmento` do onboarding). São só BASE/SUGESTÃO: o lojista aplica, edita,
 * renomeia ou ignora — nada aqui obriga ou cria nada sozinho no banco.
 *
 * Deliberadamente genérico: nenhuma regra fixa de marmitaria (ou de qualquer
 * outro nicho) vaza pro resto da aplicação — é só uma lista de sugestões de
 * nome/opções que o lojista pode aceitar com um clique.
 */

export interface ModeloOpcaoGrupo {
  nome: string;
  precoAdicional?: number;
}

export interface ModeloGrupoOpcoes {
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  opcoes: ModeloOpcaoGrupo[];
}

const MODELOS_GRUPOS_POR_SEGMENTO: Record<string, ModeloGrupoOpcoes[]> = {
  marmitas_refeicoes: [
    {
      nome: 'Proteínas',
      minEscolhas: 1,
      maxEscolhas: 1,
      obrigatorio: true,
      opcoes: [{ nome: 'Frango' }, { nome: 'Carne' }, { nome: 'Calabresa' }],
    },
    {
      nome: 'Acompanhamentos',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [
        { nome: 'Arroz' },
        { nome: 'Feijão' },
        { nome: 'Macarrão' },
        { nome: 'Farofa' },
        { nome: 'Salada' },
      ],
    },
    {
      nome: 'Deseja retirar algo?',
      minEscolhas: 0,
      maxEscolhas: 5,
      obrigatorio: false,
      opcoes: [{ nome: 'Farofa' }, { nome: 'Salada' }, { nome: 'Feijão' }],
    },
    {
      nome: 'Adicionais',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [
        { nome: 'Ovo', precoAdicional: 2 },
        { nome: 'Bacon', precoAdicional: 3 },
        { nome: 'Proteína extra', precoAdicional: 5 },
      ],
    },
  ],
  hamburgueres: [
    {
      nome: 'Ponto da carne',
      minEscolhas: 1,
      maxEscolhas: 1,
      obrigatorio: true,
      opcoes: [{ nome: 'Ao ponto' }, { nome: 'Bem passado' }, { nome: 'Mal passado' }],
    },
    {
      nome: 'Deseja retirar algum ingrediente?',
      minEscolhas: 0,
      maxEscolhas: 5,
      obrigatorio: false,
      opcoes: [{ nome: 'Alface' }, { nome: 'Tomate' }, { nome: 'Cebola' }, { nome: 'Picles' }],
    },
    {
      nome: 'Adicionais',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [
        { nome: 'Bacon', precoAdicional: 3 },
        { nome: 'Ovo', precoAdicional: 2 },
        { nome: 'Queijo extra', precoAdicional: 3 },
      ],
    },
    {
      nome: 'Molhos',
      minEscolhas: 0,
      maxEscolhas: 2,
      obrigatorio: false,
      opcoes: [{ nome: 'Barbecue' }, { nome: 'Maionese da casa' }, { nome: 'Mostarda e mel' }],
    },
  ],
  pizza: [
    {
      nome: 'Tamanho',
      minEscolhas: 1,
      maxEscolhas: 1,
      obrigatorio: true,
      opcoes: [{ nome: 'Pequena' }, { nome: 'Média' }, { nome: 'Grande' }],
    },
    {
      nome: 'Sabores',
      minEscolhas: 1,
      maxEscolhas: 2,
      obrigatorio: true,
      opcoes: [{ nome: 'Calabresa' }, { nome: 'Mussarela' }, { nome: 'Frango com catupiry' }],
    },
    {
      nome: 'Borda',
      minEscolhas: 0,
      maxEscolhas: 1,
      obrigatorio: false,
      opcoes: [
        { nome: 'Sem borda' },
        { nome: 'Catupiry', precoAdicional: 8 },
        { nome: 'Cheddar', precoAdicional: 8 },
      ],
    },
    {
      nome: 'Adicionais',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [
        { nome: 'Azeitona extra', precoAdicional: 3 },
        { nome: 'Borda recheada', precoAdicional: 8 },
      ],
    },
  ],
  acai: [
    {
      nome: 'Tamanho',
      minEscolhas: 1,
      maxEscolhas: 1,
      obrigatorio: true,
      opcoes: [{ nome: '300ml' }, { nome: '500ml' }, { nome: '700ml' }],
    },
    {
      nome: 'Complementos',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [{ nome: 'Granola' }, { nome: 'Leite em pó' }, { nome: 'Leite condensado' }],
    },
    {
      nome: 'Frutas',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [{ nome: 'Banana' }, { nome: 'Morango' }, { nome: 'Kiwi' }],
    },
    {
      nome: 'Coberturas',
      minEscolhas: 0,
      maxEscolhas: 2,
      obrigatorio: false,
      opcoes: [
        { nome: 'Leite condensado' },
        { nome: 'Nutella', precoAdicional: 4 },
        { nome: 'Paçoca' },
      ],
    },
  ],
  salgados: [
    {
      nome: 'Sabores',
      minEscolhas: 1,
      maxEscolhas: 1,
      obrigatorio: true,
      opcoes: [{ nome: 'Frango com catupiry' }, { nome: 'Carne' }, { nome: 'Queijo' }],
    },
    {
      nome: 'Molhos',
      minEscolhas: 0,
      maxEscolhas: 2,
      obrigatorio: false,
      opcoes: [{ nome: 'Molho de alho' }, { nome: 'Molho picante' }],
    },
    {
      nome: 'Adicionais',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [{ nome: 'Queijo extra', precoAdicional: 2 }],
    },
  ],
  bolos: [
    {
      nome: 'Recheio',
      minEscolhas: 1,
      maxEscolhas: 1,
      obrigatorio: true,
      opcoes: [{ nome: 'Brigadeiro' }, { nome: 'Ninho com morango' }, { nome: 'Doce de leite' }],
    },
    {
      nome: 'Cobertura',
      minEscolhas: 0,
      maxEscolhas: 1,
      obrigatorio: false,
      opcoes: [{ nome: 'Chantilly' }, { nome: 'Ganache' }, { nome: 'Chocolate granulado' }],
    },
    {
      nome: 'Adicionais',
      minEscolhas: 0,
      maxEscolhas: 3,
      obrigatorio: false,
      opcoes: [{ nome: 'Morangos extra', precoAdicional: 6 }],
    },
  ],
};

export function modelosGruposParaSegmento(segmento: string): ModeloGrupoOpcoes[] {
  return MODELOS_GRUPOS_POR_SEGMENTO[segmento] ?? [];
}
