// eslint-disable-next-line no-misleading-character-class
const MARCAS_DIACRITICAS = /[̀-ͯ]/g;
// Apóstrofos/aspas são removidos (não viram hífen) — "Hot's Salgados" vira
// "hots-salgados", não "hot-s-salgados".
const APOSTROFOS = /['’‘`´]/g;

export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .toLowerCase()
    .trim()
    .replace(APOSTROFOS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
