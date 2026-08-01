export const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const COR_PRIMARIA_PADRAO = '#16A34A';
export const COR_SECUNDARIA_PADRAO = '#15803D';

export function corValida(valor: string): boolean {
  return HEX_REGEX.test(valor);
}

export function normalizarCor(valor: string): string {
  return valor.toUpperCase();
}

/** Defesa em profundidade: se o valor vindo do banco não for um hex válido (dado antigo/corrompido), cai pro padrão. */
export function corOuPadrao(valor: string | null | undefined, padrao: string): string {
  if (!valor || !corValida(valor)) return padrao;
  return normalizarCor(valor);
}
