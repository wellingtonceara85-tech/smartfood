import { Produto } from './produto.entity';

export interface ProdutoRepository {
  /**
   * `empresaId` é passado explicitamente pelo Caso de Uso (que já o resolveu do chamador
   * autenticado) — o repositório nunca consulta outro Bounded Context para descobri-lo
   * (Produto só carrega `lojaId`, ADR-0018; `empresaId` é exigido só para o registro no Outbox).
   */
  salvar(produto: Produto, empresaId: string): Promise<void>;
  buscarPorId(id: string): Promise<Produto | null>;
  listarPorLoja(lojaId: string): Promise<Produto[]>;
}

export const PRODUTO_REPOSITORY = Symbol('ProdutoRepository');
