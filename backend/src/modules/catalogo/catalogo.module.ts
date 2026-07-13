import { Module } from '@nestjs/common';
import { IdentidadeEmpresaModule } from '../identidade-empresa/identidade-empresa.module';
import { CategoriaController } from './api/categoria.controller';
import { ProdutoController } from './api/produto.controller';
import { AlternarDisponibilidadeProdutoUseCase } from './application/use-cases/alternar-disponibilidade-produto.use-case';
import { AlternarDisponibilidadeVariacaoUseCase } from './application/use-cases/alternar-disponibilidade-variacao.use-case';
import { BuscarProdutoParaPedidoUseCase } from './application/use-cases/buscar-produto-para-pedido.use-case';
import { BuscarProdutoPorIdUseCase } from './application/use-cases/buscar-produto-por-id.use-case';
import { CriarCategoriaUseCase } from './application/use-cases/criar-categoria.use-case';
import { CriarProdutoUseCase } from './application/use-cases/criar-produto.use-case';
import { ListarCategoriasUseCase } from './application/use-cases/listar-categorias.use-case';
import { ListarProdutosUseCase } from './application/use-cases/listar-produtos.use-case';
import { CATEGORIA_REPOSITORY } from './domain/categoria.repository';
import { PRODUTO_REPOSITORY } from './domain/produto.repository';
import { PrismaCategoriaRepository } from './infrastructure/prisma-categoria.repository';
import { PrismaProdutoRepository } from './infrastructure/prisma-produto.repository';

/**
 * Bounded Context Catálogo (Missão 0011). Importa IdentidadeEmpresaModule só para consumir
 * `BuscarLojaPorEmpresaUseCase` (ADR-0022 — provider explicitamente exportado, nunca acesso
 * direto ao repositório/Prisma de outro módulo). Exporta só a Application Service Interface.
 */
@Module({
  imports: [IdentidadeEmpresaModule],
  controllers: [CategoriaController, ProdutoController],
  providers: [
    CriarCategoriaUseCase,
    ListarCategoriasUseCase,
    CriarProdutoUseCase,
    BuscarProdutoPorIdUseCase,
    BuscarProdutoParaPedidoUseCase,
    ListarProdutosUseCase,
    AlternarDisponibilidadeProdutoUseCase,
    AlternarDisponibilidadeVariacaoUseCase,
    { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
    { provide: PRODUTO_REPOSITORY, useClass: PrismaProdutoRepository },
  ],
  exports: [
    CriarCategoriaUseCase,
    ListarCategoriasUseCase,
    CriarProdutoUseCase,
    BuscarProdutoPorIdUseCase,
    BuscarProdutoParaPedidoUseCase,
    ListarProdutosUseCase,
  ],
})
export class CatalogoModule {}
