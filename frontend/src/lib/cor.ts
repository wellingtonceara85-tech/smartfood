export const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const COR_PRIMARIA_PADRAO = '#16A34A';
export const COR_SECUNDARIA_PADRAO = '#15803D';

export function corValida(valor: string): boolean {
  return HEX_REGEX.test(valor);
}

export function normalizarCor(valor: string): string {
  return valor.toUpperCase();
}

function hexParaRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbParaHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const componente = (n: number) => clamp(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${componente(r)}${componente(g)}${componente(b)}`;
}

/** Mistura a cor com branco — usada pra tons claros (ex: fundo de badge). */
export function misturarComBranco(hex: string, fator: number): string {
  const [r, g, b] = hexParaRgb(hex);
  return rgbParaHex(r + (255 - r) * fator, g + (255 - g) * fator, b + (255 - b) * fator);
}

/** Mistura a cor com preto — usada pro estado hover (mais escuro). */
export function misturarComPreto(hex: string, fator: number): string {
  const [r, g, b] = hexParaRgb(hex);
  return rgbParaHex(r * (1 - fator), g * (1 - fator), b * (1 - fator));
}

function luminanciaRelativa(hex: string): number {
  const [r, g, b] = hexParaRgb(hex).map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Decide se o texto sobre essa cor de fundo deve ser branco ou escuro.
 * Usa um limiar sobre a luminância relativa (WCAG) — abaixo de 0.5 o fundo é
 * "escuro o bastante" pro texto branco continuar legível, o que também é o
 * que já usamos nos tons saudados (verde/vermelho) do design system atual.
 */
export function corContraste(hexFundo: string): '#FFFFFF' | '#111827' {
  const luminancia = luminanciaRelativa(hexFundo);
  return luminancia > 0.5 ? '#111827' : '#FFFFFF';
}

export interface PaletaCores {
  nome: string;
  primaria: string;
  secundaria: string;
}

export const PALETAS_PRONTAS: PaletaCores[] = [
  { nome: 'SmartFood padrão', primaria: '#16A34A', secundaria: '#15803D' },
  { nome: 'Hamburgueria', primaria: '#DC2626', secundaria: '#F59E0B' },
  { nome: 'Pizzaria', primaria: '#B91C1C', secundaria: '#166534' },
  { nome: 'Açaí', primaria: '#7E22CE', secundaria: '#DB2777' },
  { nome: 'Cafeteria', primaria: '#78350F', secundaria: '#D97706' },
  { nome: 'Premium escuro', primaria: '#111827', secundaria: '#D4AF37' },
];

export interface VariaveisTemaLoja {
  '--color-primary': string;
  '--color-primary-hover': string;
  '--color-primary-light': string;
  '--color-primary-contrast-text': string;
  '--color-secondary': string;
  '--color-secondary-hover': string;
  '--color-secondary-light': string;
  '--color-secondary-contrast-text': string;
}

/** Monta as CSS custom properties do tema da loja, sempre com fallback pro padrão SmartFood. */
export function montarVariaveisTema(
  corPrimaria: string | null | undefined,
  corSecundaria: string | null | undefined,
): VariaveisTemaLoja {
  const primaria = corPrimaria && corValida(corPrimaria) ? corPrimaria : COR_PRIMARIA_PADRAO;
  const secundaria =
    corSecundaria && corValida(corSecundaria) ? corSecundaria : COR_SECUNDARIA_PADRAO;

  return {
    '--color-primary': primaria,
    '--color-primary-hover': misturarComPreto(primaria, 0.2),
    '--color-primary-light': misturarComBranco(primaria, 0.85),
    '--color-primary-contrast-text': corContraste(primaria),
    '--color-secondary': secundaria,
    '--color-secondary-hover': misturarComPreto(secundaria, 0.2),
    '--color-secondary-light': misturarComBranco(secundaria, 0.85),
    '--color-secondary-contrast-text': corContraste(secundaria),
  };
}
