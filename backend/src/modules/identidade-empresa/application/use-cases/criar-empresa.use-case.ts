import { Inject, Injectable } from '@nestjs/common';
import { Empresa } from '../../domain/empresa.entity';
import { EMPRESA_REPOSITORY, EmpresaRepository } from '../../domain/empresa.repository';
import { EmpresaCriadaEvent } from '../../domain/events/empresa-criada.domain-event';
import { CriarEmpresaCommand } from '../dtos/criar-empresa.command';

export interface CriarEmpresaResultado {
  empresaId: string;
  lojaId: string;
}

@Injectable()
export class CriarEmpresaUseCase {
  constructor(@Inject(EMPRESA_REPOSITORY) private readonly repositorio: EmpresaRepository) {}

  async execute(command: CriarEmpresaCommand): Promise<CriarEmpresaResultado> {
    const { empresa, lojaPadrao } = Empresa.criar(command);
    const evento = new EmpresaCriadaEvent(
      empresa.paraPersistencia().id,
      lojaPadrao.paraPersistencia().id,
      new Date(),
    );

    await this.repositorio.salvar(empresa, lojaPadrao, evento);

    return {
      empresaId: empresa.paraPersistencia().id,
      lojaId: lojaPadrao.paraPersistencia().id,
    };
  }
}
