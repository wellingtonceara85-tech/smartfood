import { randomBytes } from 'node:crypto';

// Deliberadamente separado de utils/convite.ts — mesmo formato de token,
// código próprio, pra nunca acoplar recuperação de senha e ativação de
// conta (ver PRD: "não reaproveitar convite de ativação como recuperação").
// Expiração bem mais curta que o convite (7 dias): o link chega na hora,
// não tem por que valer por muito tempo.
export const DURACAO_RECUPERACAO_MS = 60 * 60 * 1000; // 1 hora

export function gerarTokenRecuperacao(): { tokenBruto: string } {
  return { tokenBruto: randomBytes(32).toString('hex') };
}

export function dataExpiracaoRecuperacao(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DURACAO_RECUPERACAO_MS);
}

interface RecuperacaoEstado {
  expiraEm: Date;
  usadoEm: Date | null;
  revogadoEm: Date | null;
}

/** Único ponto de verdade sobre "esse link de recuperação ainda pode ser usado agora?" */
export function tokenRecuperacaoValido(
  recuperacao: RecuperacaoEstado,
  agora: Date = new Date(),
): boolean {
  if (recuperacao.usadoEm !== null) return false;
  if (recuperacao.revogadoEm !== null) return false;
  if (recuperacao.expiraEm.getTime() <= agora.getTime()) return false;
  return true;
}
