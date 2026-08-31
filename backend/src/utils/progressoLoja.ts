// Quantidade de categorias possíveis em montarPendenciasLoja (pendenciasLoja.ts)
// hoje: horario_funcionamento, produtos_incompletos, dados_essenciais. Cada
// uma pesa igual — resolver qualquer uma sobe o percentual na mesma medida.
const TOTAL_CRITERIOS_PENDENCIA = 3;

/**
 * % de "loja pronta" pro card do dashboard pós-onboarding — reaproveita a
 * contagem de `montarPendenciasLoja` (nunca duplica os critérios): cada
 * pendência aberta reduz o percentual proporcionalmente.
 */
export function calcularProgressoLoja(totalPendencias: number): number {
  const pendencias = Math.min(Math.max(totalPendencias, 0), TOTAL_CRITERIOS_PENDENCIA);
  return Math.round((100 * (TOTAL_CRITERIOS_PENDENCIA - pendencias)) / TOTAL_CRITERIOS_PENDENCIA);
}
