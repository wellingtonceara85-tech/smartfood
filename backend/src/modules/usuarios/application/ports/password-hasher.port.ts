/**
 * Interface para dependência externa ao domínio (Missão 0007.5, Seção 4.2) — implementação
 * concreta (bcrypt) vive em infrastructure/bcrypt-password-hasher.ts.
 */
export interface PasswordHasher {
  hash(senha: string): Promise<string>;
  comparar(senha: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
