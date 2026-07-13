import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Loja } from '../domain/loja.entity';
import { LojaRepository } from '../domain/loja.repository';

@Injectable()
export class PrismaLojaRepository implements LojaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmpresaId(empresaId: string): Promise<Loja | null> {
    const registro = await this.prisma.loja.findFirst({ where: { empresaId } });
    return registro
      ? Loja.reconstituir({
          id: registro.id,
          empresaId: registro.empresaId,
          nome: registro.nome,
          criadaEm: registro.criadaEm,
        })
      : null;
  }
}
