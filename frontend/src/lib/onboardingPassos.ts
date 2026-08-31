import { MetodoCardapio } from '../types';

export type PassoOnboarding =
  | 'segmento'
  | 'identidade'
  | 'funcionamento'
  | 'cardapio'
  | 'execucao'
  | 'revisao'
  | 'fotos'
  | 'previa'
  | 'conclusao';

const ROTULOS: Record<PassoOnboarding, string> = {
  segmento: 'O que você vende',
  identidade: 'Identidade da loja',
  funcionamento: 'Funcionamento',
  cardapio: 'Cardápio',
  execucao: 'Montar cardápio',
  revisao: 'Revisar cardápio',
  fotos: 'Fotos dos produtos',
  previa: 'Prévia',
  conclusao: 'Pronto',
};

const PASSOS_BASE: PassoOnboarding[] = ['segmento', 'identidade', 'funcionamento', 'cardapio'];

/**
 * A sequência de passos depende do método de cardápio escolhido — planilha
 * e texto colado geram um rascunho que precisa de revisão/fotos/prévia;
 * guiado/manual/arquivo têm um caminho mais curto (ver PARTE 2/3 da missão).
 * Antes do lojista escolher (`metodo` null), assume-se o caminho mais longo
 * só pra "Etapa X de Y" não subestimar o total.
 */
export function passosDoFluxo(metodo: MetodoCardapio | null): PassoOnboarding[] {
  if (metodo === 'planilha' || metodo === 'colar_texto') {
    return [...PASSOS_BASE, 'execucao', 'revisao', 'fotos', 'previa', 'conclusao'];
  }
  if (metodo === 'arquivo' || metodo === 'guiado' || metodo === 'manual') {
    return [...PASSOS_BASE, 'execucao', 'conclusao'];
  }
  return [...PASSOS_BASE, 'execucao', 'revisao', 'fotos', 'previa', 'conclusao'];
}

export function indiceDoPasso(passos: PassoOnboarding[], passo: PassoOnboarding | null): number {
  if (!passo) return 0;
  const indice = passos.indexOf(passo);
  return indice === -1 ? 0 : indice;
}

export function rotuloPasso(passo: PassoOnboarding): string {
  return ROTULOS[passo];
}

/** Passo anterior na sequência atual — usado pelo botão "Voltar" do wizard. */
export function passoAnterior(
  passos: PassoOnboarding[],
  passo: PassoOnboarding,
): PassoOnboarding | null {
  const indice = passos.indexOf(passo);
  if (indice <= 0) return null;
  return passos[indice - 1];
}
