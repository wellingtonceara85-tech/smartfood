import { describe, expect, it } from 'vitest';
import { Categoria, NomeCategoriaObrigatorioError } from '../../domain/categoria.entity';

describe('Categoria', () => {
  it('cria uma Categoria válida, com ordem default 0', () => {
    const categoria = Categoria.criar({ empresaId: 'empresa-1', nome: 'Bebidas' });
    expect(categoria.paraPersistencia().ordem).toBe(0);
  });

  it('exige nome', () => {
    expect(() => Categoria.criar({ empresaId: 'empresa-1', nome: '  ' })).toThrow(
      NomeCategoriaObrigatorioError,
    );
  });
});
