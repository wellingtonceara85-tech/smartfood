import { CanalVenda, ehCanalVendaValido } from './canal-venda';
import {
  CriarItemPedidoDados,
  ItemPedido,
  ReconstituirItemPedidoDados,
} from './item-pedido.entity';
import { ehEstadoTerminal, StatusPedido } from './status-pedido';

export interface EnderecoEntregaDados {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  complemento?: string | null;
}

export interface CriarPedidoDados {
  empresaId: string;
  /** Opcional por design (Missão 0012, Seção 3) — não é limitação temporária. */
  clienteId?: string;
  criadoPorUsuarioId: string;
  canalVenda: string;
  enderecoEntrega?: EnderecoEntregaDados;
  itens: CriarItemPedidoDados[];
}

export interface ReconstituirPedidoDados {
  id: string;
  empresaId: string;
  clienteId: string | null;
  criadoPorUsuarioId: string;
  canalVenda: CanalVenda;
  status: StatusPedido;
  enderecoEntrega: EnderecoEntregaDados | null;
  criadoEm: Date;
  itens: ReconstituirItemPedidoDados[];
}

/**
 * Aggregate Root Pedido (Missão 0012) — o mais acoplado do domínio (Missão 0004, Seção 8).
 * Snapshot completo e imutável (ADR-0003): itens/preços/endereço nunca mudam após a criação,
 * só `status` transiciona, sempre via método dedicado (nunca um "editar" genérico).
 */
export class Pedido {
  private constructor(
    private readonly id: string,
    private readonly empresaId: string,
    private readonly clienteId: string | null,
    private readonly criadoPorUsuarioId: string,
    private readonly canalVenda: CanalVenda,
    private status: StatusPedido,
    private readonly enderecoEntrega: EnderecoEntregaDados | null,
    private readonly criadoEm: Date,
    private readonly itens: ItemPedido[],
  ) {}

  /**
   * Nasce direto em AGUARDANDO_PAGAMENTO — Missão 0004 mostra "Criado (checkout confirmado) →
   * Aguardando Pagamento" como transição imediata, sem gatilho próprio; não existe um estado
   * CRIADO persistido com duração real nesta missão.
   */
  static criar(dados: CriarPedidoDados): Pedido {
    if (!ehCanalVendaValido(dados.canalVenda)) {
      throw new CanalVendaInvalidoError(dados.canalVenda);
    }
    if (!dados.itens || dados.itens.length === 0) {
      throw new PedidoSemItemError();
    }

    const itens = dados.itens.map((item) => ItemPedido.criar(item));

    return new Pedido(
      crypto.randomUUID(),
      dados.empresaId,
      dados.clienteId ?? null,
      dados.criadoPorUsuarioId,
      dados.canalVenda,
      StatusPedido.AGUARDANDO_PAGAMENTO,
      dados.enderecoEntrega ?? null,
      new Date(),
      itens,
    );
  }

  static reconstituir(dados: ReconstituirPedidoDados): Pedido {
    const itens = dados.itens.map((item) => ItemPedido.reconstituir(item));
    return new Pedido(
      dados.id,
      dados.empresaId,
      dados.clienteId,
      dados.criadoPorUsuarioId,
      dados.canalVenda,
      dados.status,
      dados.enderecoEntrega,
      dados.criadoEm,
      itens,
    );
  }

  /**
   * Regra de Negócio Global 1 (Missão 0004) + invariante de estado terminal (Missão 0012,
   * Seção 2): Concluído/Cancelado nunca transitam para nenhum outro estado, nem entre si.
   */
  cancelar(): void {
    if (ehEstadoTerminal(this.status)) {
      throw new PedidoJaFinalizadoError(this.status);
    }
    this.status = StatusPedido.CANCELADO;
  }

  /** Missão 0013 — Cozinha. Só aceita a partir de RECEBIDO (Regra Global 3, Missão 0002: nunca preparar sem pagamento confirmado). */
  iniciarPreparo(): void {
    if (this.status !== StatusPedido.RECEBIDO) {
      throw new TransicaoInvalidaError(this.status, StatusPedido.EM_PREPARO);
    }
    this.status = StatusPedido.EM_PREPARO;
  }

  /** Missão 0013 — Cozinha. Só aceita a partir de EM_PREPARO. */
  finalizarPreparo(): void {
    if (this.status !== StatusPedido.EM_PREPARO) {
      throw new TransicaoInvalidaError(this.status, StatusPedido.PRONTO);
    }
    this.status = StatusPedido.PRONTO;
  }

  valorTotal(): number {
    return this.itens.reduce((soma, item) => soma + item.subtotal(), 0);
  }

  paraPersistencia() {
    return {
      id: this.id,
      empresaId: this.empresaId,
      clienteId: this.clienteId,
      criadoPorUsuarioId: this.criadoPorUsuarioId,
      canalVenda: this.canalVenda,
      status: this.status,
      valorTotal: this.valorTotal(),
      enderecoEntrega: this.enderecoEntrega,
      criadoEm: this.criadoEm,
      itens: this.itens.map((item) => item.paraPersistencia()),
    };
  }
}

export class CanalVendaInvalidoError extends Error {
  constructor(canal: string) {
    super(`Canal de venda "${canal}" não é válido.`);
  }
}

export class PedidoSemItemError extends Error {
  constructor() {
    super('Pedido precisa ter ao menos um Item.');
  }
}

export class PedidoJaFinalizadoError extends Error {
  constructor(status: StatusPedido) {
    super(`Pedido já está em estado final (${status}) e não pode ser cancelado.`);
  }
}

export class TransicaoInvalidaError extends Error {
  constructor(statusAtual: StatusPedido, statusDesejado: StatusPedido) {
    super(
      `Pedido está em "${statusAtual}" — não pode transitar para "${statusDesejado}" a partir daí.`,
    );
  }
}
