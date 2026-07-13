import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { PRODUTO_REPOSITORY, ProdutoRepository } from '../../domain/produto.repository';

@Injectable()
export class BuscarProdutoPorIdUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly repositorio: ProdutoRepository,
    private readonly buscarLojaPorEmpresa: BuscarLojaPorEmpresaUseCase,
  ) {}

  async execute(produtoId: string, chamadorEmpresaId: string) {
    const produto = await this.repositorio.buscarPorId(produtoId);
    if (!produto) {
      return null;
    }

    const loja = await this.buscarLojaPorEmpresa.execute(chamadorEmpresaId);
    if (!loja || produto.paraPersistencia().lojaId !== loja.id) {
      throw new ForbiddenException('Produto não pertence à sua Empresa.');
    }

    return produto.paraPersistencia();
  }
}
