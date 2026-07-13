import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BuscarProdutoParaPedidoUseCase } from '../../../catalogo/application/use-cases/buscar-produto-para-pedido.use-case';
import { CriarItemPedidoDados, QuantidadeItemInvalidaError } from '../../domain/item-pedido.entity';
import { CanalVendaInvalidoError, Pedido, PedidoSemItemError } from '../../domain/pedido.entity';
import { PEDIDO_REPOSITORY, PedidoRepository } from '../../domain/pedido.repository';
import { CriarPedidoCommand } from '../dtos/criar-pedido.command';

export interface CriarPedidoResultado {
  pedidoId: string;
}

@Injectable()
export class CriarPedidoUseCase {
  constructor(
    @Inject(PEDIDO_REPOSITORY) private readonly repositorio: PedidoRepository,
    private readonly buscarProdutoParaPedido: BuscarProdutoParaPedidoUseCase,
  ) {}

  async execute(command: CriarPedidoCommand): Promise<CriarPedidoResultado> {
    const itens: CriarItemPedidoDados[] = [];

    for (const itemCommand of command.itens) {
      const produto = await this.buscarProdutoParaPedido.execute(
        itemCommand.produtoId,
        itemCommand.variacaoId,
        command.empresaId,
      );

      if (!produto) {
        throw new BadRequestException(
          `Produto/Variação "${itemCommand.produtoId}/${itemCommand.variacaoId}" não encontrado.`,
        );
      }
      if (!produto.produtoDisponivel || !produto.variacaoDisponivel) {
        throw new BadRequestException(
          `Produto "${produto.produtoNome}" (Variação "${produto.variacaoNome}") não está disponível.`,
        );
      }

      itens.push({
        produtoId: produto.produtoId,
        variacaoId: produto.variacaoId,
        nomeProduto: produto.produtoNome,
        nomeVariacao: produto.variacaoNome,
        descricaoProduto: produto.produtoDescricao,
        codigoInternoVariacao: produto.variacaoCodigoInterno,
        precoValor: produto.variacaoPrecoValor,
        precoMoeda: produto.variacaoPrecoMoeda,
        quantidade: itemCommand.quantidade,
      });
    }

    let pedido: Pedido;
    try {
      pedido = Pedido.criar({
        empresaId: command.empresaId,
        clienteId: command.clienteId,
        criadoPorUsuarioId: command.criadoPorUsuarioId,
        canalVenda: command.canalVenda,
        enderecoEntrega: command.enderecoEntrega,
        itens,
      });
    } catch (erro) {
      if (
        erro instanceof CanalVendaInvalidoError ||
        erro instanceof PedidoSemItemError ||
        erro instanceof QuantidadeItemInvalidaError
      ) {
        throw new BadRequestException(erro.message);
      }
      throw erro;
    }

    await this.repositorio.salvar(pedido);

    return { pedidoId: pedido.paraPersistencia().id };
  }
}
