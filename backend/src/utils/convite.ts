import { createHash, randomBytes } from 'node:crypto';

/** Convite válido por 7 dias — tempo suficiente pro lojista receber o link pelo WhatsApp e ativar. */
export const DURACAO_CONVITE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Gera um token de convite: o valor bruto (256 bits, só existe no link
 * enviado ao lojista) e o hash SHA-256 dele (o que efetivamente é gravado no
 * banco). Nunca persistir nem logar o token bruto — só o hash permite
 * localizar o convite depois.
 */
export function gerarTokenConvite(): { tokenBruto: string; tokenHash: string } {
  const tokenBruto = randomBytes(32).toString('hex');
  return { tokenBruto, tokenHash: hashToken(tokenBruto) };
}

export function hashToken(tokenBruto: string): string {
  return createHash('sha256').update(tokenBruto).digest('hex');
}

export function dataExpiracaoConvite(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DURACAO_CONVITE_MS);
}

interface ConviteEstado {
  expiraEm: Date;
  usadoEm: Date | null;
  revogadoEm: Date | null;
}

/** Único ponto de verdade sobre "esse convite ainda pode ser usado agora?" — reutilizado na validação e na ativação. */
export function conviteValido(convite: ConviteEstado, agora: Date = new Date()): boolean {
  if (convite.usadoEm !== null) return false;
  if (convite.revogadoEm !== null) return false;
  if (convite.expiraEm.getTime() <= agora.getTime()) return false;
  return true;
}
