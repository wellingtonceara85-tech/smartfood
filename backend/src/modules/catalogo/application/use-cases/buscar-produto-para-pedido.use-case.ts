import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BuscarLojaPorEmpresaUseCase } from '../../../identidade-empresa/application/use-cases/buscar-loja-por-empresa.use-case';
import { PRODUTO_REPOSITORY, ProdutoRepository } from '../../domain/produto.repository';

/**
 * DTO estreito para consumo do Bounded Context Pedidos (Missão 0012, Seção 7) — evita que
 * Pedidos dependa da representação interna completa de Produto (ADR-0022).
 */
export interface ProdutoParaPedidoDto {
  produtoId: string;
  produtoNome: string;
  produtoDescricao: string | null;
  produtoDisponivel: boolean;
  variacaoId: string;
  variacaoNome: string;
  variacaoCodigoInterno: string | null;
  variacaoPrecoValor: number;
  variacaoPrecoMoeda: string;
  variacaoDisponivel: boolean;
}

/**
 * Mesma verificação de posse (Loja↔Empresa do chamador) que `BuscarProdutoPorIdUseCase` já
 * aplica — sem ela, este Use Case reabriria o mesmo gap de isolamento entre tenants que a
 * Missão 0011 fechou.
 */
@Injectable()
export class BuscarProdutoParaPedidoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly repositorio: ProdutoRepository,
    private readonly buscarLojaPorEmpresa: BuscarLojaPorEmpresaUseCase,
  ) {}

  async execute(
    produtoId: string,
    variacaoId: string,
    chamadorEmpresaId: string,
  ): Promise<ProdutoParaPedidoDto | null> {
    const produto = await this.repositorio.buscarPorId(produtoId);
    if (!produto) {
      return null;
    }

    const loja = await this.buscarLojaPorEmpresa.execute(chamadorEmpresaId);
    if (!loja || produto.paraPersistencia().lojaId !== loja.id) {
      throw new ForbiddenException('Produto não pertence à sua Empresa.');
    }

    const dados = produto.paraPersistencia();
    const variacao = dados.variacoes.find((v) => v.id === variacaoId);
    if (!variacao) {
      return null;
    }

    return {
      produtoId: dados.id,
      produtoNome: dados.nome,
      produtoDescricao: dados.descricao,
      produtoDisponivel: dados.disponivel,
      variacaoId: variacao.id,
      variacaoNome: variacao.nome,
      variacaoCodigoInterno: variacao.codigoInterno,
      variacaoPrecoValor: variacao.precoValor,
      variacaoPrecoMoeda: variacao.precoMoeda,
      variacaoDisponivel: variacao.disponivel,
    };
  }
}
