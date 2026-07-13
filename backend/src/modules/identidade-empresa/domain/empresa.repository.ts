import { Empresa } from './empresa.entity';
import { EmpresaCriadaEvent } from './events/empresa-criada.domain-event';
import { Loja } from './loja.entity';

/**
 * Interface do repositório (porta) — Domain nunca conhece Prisma (Missão 0007.5, Seção 4.1).
 * Implementação concreta vive em infrastructure/prisma-empresa.repository.ts.
 */
export interface EmpresaRepository {
  /** Grava Empresa + Loja + o registro do evento no Outbox na mesma transação (ADR-0023). */
  salvar(empresa: Empresa, lojaPadrao: Loja, evento: EmpresaCriadaEvent): Promise<void>;
  buscarPorId(id: string): Promise<Empresa | null>;
}

export const EMPRESA_REPOSITORY = Symbol('EmpresaRepository');
