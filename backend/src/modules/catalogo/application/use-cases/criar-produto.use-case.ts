import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { CATEGORIA_REPOSITORY, CategoriaRepository } from '../../domain/categoria.repository';
import { Produto } from '../../domain/produto.entity';
import { PRODUTO_REPOSITORY, ProdutoRepository } from '../../domain/produto.repository';
import { CriarProdutoCommand } from '../dtos/criar-produto.command';

export interface CriarProdutoResultado {
  produtoId: string;
}

/**
 * `lojaId` nunca vem do cliente (Missão 0011) — é resolvido a partir da Empresa do chamador
 * autenticado via `BuscarLojaPorEmpresaUseCase` (Identidade & Empresa, ADR-0022): chamada de
 * função entre módulos através de provider exportado, nunca acesso direto ao repositório alheio.
 */
@Injectable()
export class CriarProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepositorio: ProdutoRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categoriaRepositorio: CategoriaRepository,
    private readonly buscarLojaPorEmpresa: BuscarLojaPorEmpresaUseCase,
  ) {}

  async execute(command: CriarProdutoCommand): Promise<CriarProdutoResultado> {
    const categoria = await this.categoriaRepositorio.buscarPorId(command.categoriaId);
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada.');
    }
    if (categoria.paraPersistencia().empresaId !== command.empresaId) {
      throw new ForbiddenException('Categoria não pertence à sua Empresa.');
    }

    const loja = await this.buscarLojaPorEmpresa.execute(command.empresaId);
    if (!loja) {
      throw new NotFoundException('Loja da Empresa não encontrada.');
    }

    const produto = Produto.criar({
      lojaId: loja.id,
      categoriaId: command.categoriaId,
      nome: command.nome,
      descricao: command.descricao,
      imagemUrl: command.imagemUrl,
      controlaEstoque: command.controlaEstoque,
      primeiraVariacao: command.primeiraVariacao,
    });

    await this.produtoRepositorio.salvar(produto, command.empresaId);

    return { produtoId: produto.paraPersistencia().id };
  }
}
