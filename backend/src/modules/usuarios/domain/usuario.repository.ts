import { Usuario } from './usuario.entity';

export interface UsuarioRepository {
  salvar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmailEEmpresa(email: string, empresaId: string): Promise<Usuario | null>;
  contarPorEmpresa(empresaId: string): Promise<number>;
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');
