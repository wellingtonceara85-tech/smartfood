import { Inject, Injectable } from '@nestjs/common';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/empresa.repository';

@Injectable()
export class BuscarEmpresaPorIdUseCase {
  constructor(@Inject(EMPRESA_REPOSITORY) private readonly repositorio: EmpresaRepository) {}

  async execute(id: string) {
    const empresa = await this.repositorio.buscarPorId(id);
    return empresa ? empresa.paraPersistencia() : null;
  }
}
