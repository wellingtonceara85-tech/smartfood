import type { ItemPedido as ItemPedidoPrisma, Pedido as PedidoPrisma } from '@prisma/client';
import { CanalVenda } from '../domain/canal-venda';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido';

type PedidoComItens = PedidoPrisma & { itens: ItemPedidoPrisma[] };

export class PedidoMapper {
  static paraDominio(registro: PedidoComItens): Pedido {
    return Pedido.reconstituir({
      id: registro.id,
      empresaId: registro.empresaId,
      clienteId: registro.clienteId,
      criadoPorUsuarioId: registro.criadoPorUsuarioId,
      canalVenda: registro.canalVenda as unknown as CanalVenda,
      status: registro.status as unknown as StatusPedido,
      enderecoEntrega: registro.enderecoRua
        ? {
            rua: registro.enderecoRua,
            numero: registro.enderecoNumero ?? '',
            bairro: registro.enderecoBairro ?? '',
            cidade: registro.enderecoCidade ?? '',
            cep: registro.enderecoCep ?? '',
            complemento: registro.enderecoComplemento,
          }
        : null,
      criadoEm: registro.criadoEm,
      itens: registro.itens.map((item) => ({
        id: item.id,
        produtoId: item.produtoId,
        variacaoId: item.variacaoId,
        nomeProduto: item.nomeProduto,
        nomeVariacao: item.nomeVariacao,
        descricaoProduto: item.descricaoProduto,
        codigoInternoVariacao: item.codigoInternoVariacao,
        precoValor: Number(item.precoValor),
        precoMoeda: item.precoMoeda,
        quantidade: item.quantidade,
      })),
    });
  }
}
