import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIA_REPOSITORY, CategoriaRepository } from '../../domain/categoria.repository';

@Injectable()
export class ListarCategoriasUseCase {
  constructor(@Inject(CATEGORIA_REPOSITORY) private readonly repositorio: CategoriaRepository) {}

  async execute(empresaId: string) {
    const categorias = await this.repositorio.listarPorEmpresa(empresaId);
    return categorias.map((c) => c.paraPersistencia());
  }
}
