import { OnboardingLoja } from '../types';

/**
 * Valor inicial do seletor de "Tipo de negócio" em Minha loja — sempre a
 * partir do que já está salvo em OnboardingLoja.segmentoNegocio, nunca
 * inventa um segmento. `null`/ausente vira string vazia (nenhuma opção
 * selecionada), o mesmo valor que representa "não definido" no <select>.
 */
export function segmentoInicial(
  onboarding: Pick<OnboardingLoja, 'segmentoNegocio'> | null,
): string {
  return onboarding?.segmentoNegocio ?? '';
}

/**
 * Corpo enviado a PUT /admin/onboarding pra salvar só o tipo de negócio —
 * deliberadamente só essa chave. Nunca inclui etapaAtual, status,
 * etapasConcluidas ou metodoCardapio: essa ação não reabre nem avança o
 * progresso do onboarding guiado da loja, só atualiza o segmento.
 */
export function corpoAtualizarSegmento(segmentoNegocio: string): { segmentoNegocio: string } {
  return { segmentoNegocio };
}

/**
 * O tipo de negócio nunca é obrigatório — uma loja pode continuar sem
 * definir. Só habilita o botão de salvar quando o lojista efetivamente
 * escolheu algo (evita um PUT sem sentido pra "nenhuma opção selecionada").
 */
export function podeSalvarSegmento(segmentoSelecionado: string, salvando: boolean): boolean {
  return !salvando && segmentoSelecionado !== '';
}
