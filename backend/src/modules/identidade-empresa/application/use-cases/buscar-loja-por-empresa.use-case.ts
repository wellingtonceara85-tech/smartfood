import { Inject, Injectable } from '@nestjs/common';
import { LOJA_REPOSITORY, LojaRepository } from '../../domain/loja.repository';

/**
 * Consumido por outros Bounded Contexts (ex.: Catálogo, Missão 0011) para resolver a Loja do
 * chamador autenticado sem confiar em `lojaId` vindo do cliente — chamada de função entre
 * módulos através de provider exportado (ADR-0022), nunca acesso direto a repositório alheio.
 */
@Injectable()
export class BuscarLojaPorEmpresaUseCase {
  constructor(@Inject(LOJA_REPOSITORY) private readonly repositorio: LojaRepository) {}

  async execute(empresaId: string) {
    const loja = await this.repositorio.buscarPorEmpresaId(empresaId);
    return loja ? loja.paraPersistencia() : null;
  }
}
