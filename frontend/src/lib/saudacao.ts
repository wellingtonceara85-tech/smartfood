export type PeriodoDia = 'manha' | 'tarde' | 'noite';

const ROTULO_POR_PERIODO: Record<PeriodoDia, string> = {
  manha: 'Bom dia',
  tarde: 'Boa tarde',
  noite: 'Boa noite',
};

/** 5h–11h59 manhã, 12h–17h59 tarde, resto (18h–4h59) noite. */
export function periodoDoDia(hora: number): PeriodoDia {
  if (hora >= 5 && hora < 12) return 'manha';
  if (hora >= 12 && hora < 18) return 'tarde';
  return 'noite';
}

/** "Bom dia" / "Boa tarde" / "Boa noite" a partir da hora local (0-23). */
export function saudacaoPorHora(hora: number): string {
  return ROTULO_POR_PERIODO[periodoDoDia(hora)];
}

/**
 * Nome a usar na saudação: primeiro nome do usuário logado, senão nome da
 * loja, senão null (fallback neutro — o chamador exibe só a saudação, sem
 * nome nenhum). Nunca hardcodar um nome de pessoa aqui.
 */
export function nomeParaSaudacao(
  nomeUsuario: string | null | undefined,
  nomeLoja: string | null | undefined,
): string | null {
  const usuario = nomeUsuario?.trim();
  if (usuario) return usuario.split(' ')[0];

  const loja = nomeLoja?.trim();
  if (loja) return loja;

  return null;
}
