import { Injectable } from '@nestjs/common';
import { OutboxService } from '../../../platform/outbox/outbox.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Empresa } from '../domain/empresa.entity';
import { EmpresaRepository } from '../domain/empresa.repository';
import { EmpresaCriadaEvent } from '../domain/events/empresa-criada.domain-event';
import { Loja } from '../domain/loja.entity';
import { EmpresaMapper } from './empresa.mapper';

/**
 * Único lugar do módulo que importa PrismaClient diretamente (Missão 0007.5, Seção 4.3).
 */
@Injectable()
export class PrismaEmpresaRepository implements EmpresaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async salvar(empresa: Empresa, lojaPadrao: Loja, evento: EmpresaCriadaEvent): Promise<void> {
    const dadosEmpresa = empresa.paraPersistencia();
    const dadosLoja = lojaPadrao.paraPersistencia();

    await this.prisma.$transaction(async (tx) => {
      await tx.empresa.create({ data: dadosEmpresa });
      await tx.loja.create({ data: dadosLoja });
      await this.outbox.registrar(tx, {
        tipo: EmpresaCriadaEvent.tipo,
        agregadoOrigem: 'Empresa',
        empresaId: dadosEmpresa.id,
        payload: {
          empresaId: evento.empresaId,
          lojaId: evento.lojaId,
          ocorridoEm: evento.ocorridoEm.toISOString(),
        },
      });
    });
  }

  async buscarPorId(id: string): Promise<Empresa | null> {
    const registro = await this.prisma.empresa.findUnique({ where: { id } });
    return registro ? EmpresaMapper.paraDominio(registro) : null;
  }
}
