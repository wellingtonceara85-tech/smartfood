import { describe, expect, it } from 'vitest';
import { CanalVenda } from '../../domain/canal-venda';
import { QuantidadeItemInvalidaError } from '../../domain/item-pedido.entity';
import {
  CanalVendaInvalidoError,
  Pedido,
  PedidoJaFinalizadoError,
  PedidoSemItemError,
  TransicaoInvalidaError,
} from '../../domain/pedido.entity';
import { StatusPedido } from '../../domain/status-pedido';

const itemValido = {
  produtoId: 'produto-1',
  variacaoId: 'variacao-1',
  nomeProduto: 'Coca-Cola',
  nomeVariacao: 'Lata 350ml',
  descricaoProduto: null,
  codigoInternoVariacao: 'SKU-001',
  precoValor: 6.5,
  precoMoeda: 'BRL',
  quantidade: 2,
};

const dadosValidos = {
  empresaId: 'empresa-1',
  criadoPorUsuarioId: 'usuario-1',
  canalVenda: CanalVenda.BALCAO,
  itens: [itemValido],
};

describe('Pedido', () => {
  it('nasce em Aguardando Pagamento, sem retroceder de um estado "Criado" separado', () => {
    const pedido = Pedido.criar(dadosValidos);
    expect(pedido.paraPersistencia().status).toBe(StatusPedido.AGUARDANDO_PAGAMENTO);
  });

  it('calcula valorTotal como soma dos subtotais dos itens', () => {
    const pedido = Pedido.criar({
      ...dadosValidos,
      itens: [
        { ...itemValido, precoValor: 10, quantidade: 2 },
        { ...itemValido, precoValor: 5, quantidade: 3 },
      ],
    });
    expect(pedido.paraPersistencia().valorTotal).toBe(35);
  });

  it('exige ao menos um Item', () => {
    expect(() => Pedido.criar({ ...dadosValidos, itens: [] })).toThrow(PedidoSemItemError);
  });

  it('exige canal de venda válido', () => {
    expect(() => Pedido.criar({ ...dadosValidos, canalVenda: 'TELEFONE' })).toThrow(
      CanalVendaInvalidoError,
    );
  });

  it('rejeita item com quantidade inválida', () => {
    expect(() =>
      Pedido.criar({ ...dadosValidos, itens: [{ ...itemValido, quantidade: 0 }] }),
    ).toThrow(QuantidadeItemInvalidaError);
  });

  it('nasce sem Cliente por padrão — característica do domínio, não limitação (Missão 0012, Seção 3)', () => {
    const pedido = Pedido.criar(dadosValidos);
    expect(pedido.paraPersistencia().clienteId).toBeNull();
  });

  it('cancelar() transita para Cancelado a partir de Aguardando Pagamento', () => {
    const pedido = Pedido.criar(dadosValidos);
    pedido.cancelar();
    expect(pedido.paraPersistencia().status).toBe(StatusPedido.CANCELADO);
  });

  it('Invariante de estado terminal — não permite cancelar um Pedido já Cancelado', () => {
    const pedido = Pedido.criar(dadosValidos);
    pedido.cancelar();
    expect(() => pedido.cancelar()).toThrow(PedidoJaFinalizadoError);
  });

  it('Invariante de estado terminal — não permite cancelar um Pedido já Concluído', () => {
    const pedido = Pedido.reconstituir({
      id: 'pedido-1',
      empresaId: 'empresa-1',
      clienteId: null,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      status: StatusPedido.CONCLUIDO,
      enderecoEntrega: null,
      criadoEm: new Date(),
      itens: [{ ...itemValido, id: 'item-1' }],
    });

    expect(() => pedido.cancelar()).toThrow(PedidoJaFinalizadoError);
  });

  function pedidoEm(status: StatusPedido): Pedido {
    return Pedido.reconstituir({
      id: 'pedido-1',
      empresaId: 'empresa-1',
      clienteId: null,
      criadoPorUsuarioId: 'usuario-1',
      canalVenda: CanalVenda.BALCAO,
      status,
      enderecoEntrega: null,
      criadoEm: new Date(),
      itens: [{ ...itemValido, id: 'item-1' }],
    });
  }

  it('Missão 0013 — iniciarPreparo() transita de Recebido para Em Preparo', () => {
    const pedido = pedidoEm(StatusPedido.RECEBIDO);
    pedido.iniciarPreparo();
    expect(pedido.paraPersistencia().status).toBe(StatusPedido.EM_PREPARO);
  });

  it('Missão 0013 — iniciarPreparo() rejeita qualquer estado que não seja Recebido', () => {
    const pedido = pedidoEm(StatusPedido.AGUARDANDO_PAGAMENTO);
    expect(() => pedido.iniciarPreparo()).toThrow(TransicaoInvalidaError);
  });

  it('Missão 0013 — finalizarPreparo() transita de Em Preparo para Pronto', () => {
    const pedido = pedidoEm(StatusPedido.EM_PREPARO);
    pedido.finalizarPreparo();
    expect(pedido.paraPersistencia().status).toBe(StatusPedido.PRONTO);
  });

  it('Missão 0013 — finalizarPreparo() rejeita qualquer estado que não seja Em Preparo', () => {
    const pedido = pedidoEm(StatusPedido.RECEBIDO);
    expect(() => pedido.finalizarPreparo()).toThrow(TransicaoInvalidaError);
  });

  it('Missão 0013 (ADR-0025) — Pronto e Saiu para Entrega são valores distintos do enum', () => {
    expect(StatusPedido.PRONTO).not.toBe(StatusPedido.SAIU_PARA_ENTREGA);
  });
});
