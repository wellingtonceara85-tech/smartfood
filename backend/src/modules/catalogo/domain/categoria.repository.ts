import { Categoria } from './categoria.entity';

export interface CategoriaRepository {
  salvar(categoria: Categoria): Promise<void>;
  buscarPorId(id: string): Promise<Categoria | null>;
  listarPorEmpresa(empresaId: string): Promise<Categoria[]>;
}

export const CATEGORIA_REPOSITORY = Symbol('CategoriaRepository');
