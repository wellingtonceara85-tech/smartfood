import type { Categoria as CategoriaPrisma } from '@prisma/client';
import { Categoria } from '../domain/categoria.entity';

export class CategoriaMapper {
  static paraDominio(registro: CategoriaPrisma): Categoria {
    return Categoria.reconstituir({
      id: registro.id,
      empresaId: registro.empresaId,
      nome: registro.nome,
      ordem: registro.ordem,
      criadaEm: registro.criadaEm,
    });
  }
}
