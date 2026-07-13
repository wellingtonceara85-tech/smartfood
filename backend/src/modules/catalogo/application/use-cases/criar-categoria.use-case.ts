import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIA_REPOSITORY, CategoriaRepository } from '../../domain/categoria.repository';
import { Categoria } from '../../domain/categoria.entity';
import { CriarCategoriaCommand } from '../dtos/criar-categoria.command';

export interface CriarCategoriaResultado {
  categoriaId: string;
}

@Injectable()
export class CriarCategoriaUseCase {
  constructor(@Inject(CATEGORIA_REPOSITORY) private readonly repositorio: CategoriaRepository) {}

  async execute(command: CriarCategoriaCommand): Promise<CriarCategoriaResultado> {
    const categoria = Categoria.criar(command);
    await this.repositorio.salvar(categoria);
    return { categoriaId: categoria.paraPersistencia().id };
  }
}
