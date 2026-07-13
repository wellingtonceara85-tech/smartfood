import { Inject, Injectable } from '@nestjs/common';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { PRODUTO_REPOSITORY, ProdutoRepository } from '../../domain/produto.repository';

@Injectable()
export class ListarProdutosUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly repositorio: ProdutoRepository,
    private readonly buscarLojaPorEmpresa: BuscarLojaPorEmpresaUseCase,
  ) {}

  async execute(chamadorEmpresaId: string) {
    const loja = await this.buscarLojaPorEmpresa.execute(chamadorEmpresaId);
    if (!loja) {
      return [];
    }

    const produtos = await this.repositorio.listarPorLoja(loja.id);
    return produtos.map((p) => p.paraPersistencia());
  }
}
