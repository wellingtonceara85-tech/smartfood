import { Loja } from './loja.entity';

export interface LojaRepository {
  /** MVP: 1 Loja por Empresa (Missão 0006, Seção 2) — sempre a primeira/única. */
  buscarPorEmpresaId(empresaId: string): Promise<Loja | null>;
}

export const LOJA_REPOSITORY = Symbol('LojaRepository');
