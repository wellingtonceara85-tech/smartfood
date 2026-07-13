/**
 * Único lugar que lê JWT_SECRET — evita risco de JwtModule e JwtStrategy divergirem
 * (um assina, outro verifica, com segredos diferentes por engano).
 */
export function obterJwtSecret(): string {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error('JWT_SECRET não definido — configure no .env (ver .env.example).');
  }
  return segredo;
}
