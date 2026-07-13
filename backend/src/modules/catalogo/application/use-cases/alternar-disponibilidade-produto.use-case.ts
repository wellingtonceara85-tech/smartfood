import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { ProdutoSemVariacaoDisponivelError } from '../../domain/produto.entity';
import { PRODUTO_REPOSITORY, ProdutoRepository } from '../../domain/produto.repository';

@Injectable()
export class AlternarDisponibilidadeProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly repositorio: ProdutoRepository,
    private readonly buscarLojaPorEmpresa: BuscarLojaPorEmpresaUseCase,
  ) {}

  async execute(produtoId: string, chamadorEmpresaId: string) {
    const produto = await this.repositorio.buscarPorId(produtoId);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const loja = await this.buscarLojaPorEmpresa.execute(chamadorEmpresaId);
    if (!loja || produto.paraPersistencia().lojaId !== loja.id) {
      throw new ForbiddenException('Produto não pertence à sua Empresa.');
    }

    try {
      produto.alternarDisponibilidade();
    } catch (erro) {
      if (erro instanceof ProdutoSemVariacaoDisponivelError) {
        throw new BadRequestException(erro.message);
      }
      throw erro;
    }

    await this.repositorio.salvar(produto, chamadorEmpresaId);

    return produto.paraPersistencia();
  }
}
