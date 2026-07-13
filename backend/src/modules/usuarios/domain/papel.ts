/**
 * Papéis internos que se aplicam a Usuário (Missão 0010, Seção 2) — subconjunto dos 7 papéis
 * do Smart Security Guide. Cliente e Visitante não entram aqui: mapeiam para o outro fluxo de
 * identidade do ADR-0024 (Cliente) ou para acesso público, nunca para Papel de Usuário interno.
 */
export enum PapelNome {
  ADMINISTRADOR = 'Administrador',
  GERENTE = 'Gerente',
  SUPERVISOR = 'Supervisor',
  OPERADOR = 'Operador',
  FINANCEIRO = 'Financeiro',
}

export const PAPEIS_INTERNOS: readonly PapelNome[] = Object.values(PapelNome);

export function ehPapelValido(valor: string): valor is PapelNome {
  return (PAPEIS_INTERNOS as readonly string[]).includes(valor);
}
