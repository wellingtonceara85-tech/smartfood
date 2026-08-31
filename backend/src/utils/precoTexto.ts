/**
 * Interpreta um preço escrito em texto livre (planilha ou lista colada) de
 * forma conservadora — só aceita formatos numéricos inequívocos em reais.
 * Nunca "adivinha": qualquer coisa fora do padrão retorna null, pra quem
 * chamar marcar o item como "precisa revisão" em vez de gravar um valor
 * inventado. Formatos aceitos: "8", "8.5", "8,00", "8.000,00", "1.234,50",
 * com ou sem prefixo "R$"/"r$".
 */
export function interpretarPreco(bruto: string): number | null {
  const semMoeda = bruto
    .replace(/r\$/gi, '')
    .replace(/reais?/gi, '')
    .trim();
  if (!semMoeda) return null;

  // 1.234,50 ou 8,00 — formato brasileiro (vírgula decimal).
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(semMoeda)) {
    const numero = Number(semMoeda.replace(/\./g, '').replace(',', '.'));
    return validarPositivo(numero);
  }

  // 8,5 (vírgula decimal sem milhar)
  if (/^\d+,\d{1,2}$/.test(semMoeda)) {
    return validarPositivo(Number(semMoeda.replace(',', '.')));
  }

  // 8.50 ou 8 — formato com ponto decimal (ou inteiro)
  if (/^\d+(\.\d{1,2})?$/.test(semMoeda)) {
    return validarPositivo(Number(semMoeda));
  }

  return null;
}

function validarPositivo(numero: number): number | null {
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.round(numero * 100) / 100;
}
