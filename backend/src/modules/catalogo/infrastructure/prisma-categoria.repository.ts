import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaRepository } from '../domain/categoria.repository';
import { CategoriaMapper } from './categoria.mapper';

@Injectable()
export class PrismaCategoriaRepository implements CategoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(categoria: Categoria): Promise<void> {
    const dados = categoria.paraPersistencia();
    await this.prisma.categoria.upsert({
      where: { id: dados.id },
      create: dados,
      update: dados,
    });
  }

  async buscarPorId(id: string): Promise<Categoria | null> {
    const registro = await this.prisma.categoria.findUnique({ where: { id } });
    return registro ? CategoriaMapper.paraDominio(registro) : null;
  }

  async listarPorEmpresa(empresaId: string): Promise<Categoria[]> {
    const registros = await this.prisma.categoria.findMany({
      where: { empresaId },
      orderBy: { ordem: 'asc' },
    });
    return registros.map((r) => CategoriaMapper.paraDominio(r));
  }
}
