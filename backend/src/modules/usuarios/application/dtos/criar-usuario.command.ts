export interface CriarUsuarioCommand {
  empresaId: string;
  nome: string;
  email: string;
  senha: string;
  papel?: string;
  /** Papel do chamador autenticado — ausente quando é o bootstrap do primeiro Usuário (Missão 0010, Seção 3). */
  chamador?: { usuarioId: string; empresaId: string; papel: string };
}
