export interface SegmentoOpcao {
  chave: string;
  rotulo: string;
}

/** Etapa 1 do onboarding — "O que você vende principalmente?" (uma única opção). */
export const SEGMENTOS_LOJA: SegmentoOpcao[] = [
  { chave: 'marmitas_refeicoes', rotulo: 'Marmitas / Refeições' },
  { chave: 'salgados', rotulo: 'Salgados' },
  { chave: 'bolos', rotulo: 'Bolos' },
  { chave: 'hamburgueres', rotulo: 'Hambúrgueres' },
  { chave: 'pizza', rotulo: 'Pizza' },
  { chave: 'espetinhos', rotulo: 'Espetinhos' },
  { chave: 'acai', rotulo: 'Açaí' },
  { chave: 'doces_sobremesas', rotulo: 'Doces / Sobremesas' },
  { chave: 'bebidas', rotulo: 'Bebidas' },
  { chave: 'outro', rotulo: 'Outro' },
];

/**
 * Sugestões de NOME de categoria por segmento (Parte 2, opção "Montar com
 * ajuda do SmartFood") — nunca produto, nunca preço: o lojista escolhe,
 * edita ou descarta cada sugestão antes de qualquer coisa virar real.
 * Todos os 10 segmentos têm sugestão própria e coerente, incluindo "outro"
 * (lista mínima genérica, mas editável do mesmo jeito que as demais).
 */
const CATEGORIAS_SUGERIDAS_POR_SEGMENTO: Record<string, string[]> = {
  marmitas_refeicoes: ['Marmitas', 'Pratos do dia', 'Combos', 'Bebidas', 'Sobremesas'],
  espetinhos: ['Espetinhos', 'Combos', 'Porções', 'Acompanhamentos', 'Bebidas'],
  bolos: ['Bolos caseiros', 'Bolos recheados', 'Mini bolos', 'Doces', 'Bebidas'],
  salgados: ['Salgados', 'Mini salgados', 'Combos', 'Centos', 'Bebidas'],
  hamburgueres: ['Lanches', 'Combos', 'Porções', 'Bebidas', 'Sobremesas'],
  pizza: ['Pizzas tradicionais', 'Pizzas especiais', 'Bebidas', 'Sobremesas'],
  acai: ['Açaí', 'Copos prontos', 'Complementos', 'Bebidas'],
  doces_sobremesas: ['Doces', 'Tortas', 'Bolos', 'Bebidas'],
  bebidas: ['Bebidas', 'Combos'],
  outro: ['Cardápio', 'Bebidas'],
};

export function segmentoValido(segmento: string): boolean {
  return SEGMENTOS_LOJA.some((s) => s.chave === segmento);
}

export function sugerirCategoriasPorSegmento(segmento: string): string[] {
  return CATEGORIAS_SUGERIDAS_POR_SEGMENTO[segmento] ?? [];
}
