import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Usuario } from '../domain/usuario.entity';
import { UsuarioRepository } from '../domain/usuario.repository';
import { UsuarioMapper } from './usuario.mapper';

const INCLUDE_PAPEIS = { papeis: { include: { papel: true } } } as const;

/**
 * Único lugar do módulo que importa PrismaClient diretamente (Missão 0007.5, Seção 4.3).
 */
@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(usuario: Usuario): Promise<void> {
    const dados = usuario.paraPersistencia();

    await this.prisma.$transaction(async (tx) => {
      const papel = await tx.papel.findUniqueOrThrow({ where: { nome: dados.papel } });

      await tx.usuario.create({
        data: {
          id: dados.id,
          empresaId: dados.empresaId,
          nome: dados.nome,
          email: dados.email,
          senhaHash: dados.senhaHash,
          criadoEm: dados.criadoEm,
          papeis: { create: { papelId: papel.id } },
        },
      });
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({
      where: { id },
      include: INCLUDE_PAPEIS,
    });
    return registro ? UsuarioMapper.paraDominio(registro) : null;
  }

  async buscarPorEmailEEmpresa(email: string, empresaId: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({
      where: { empresaId_email: { empresaId, email: email.trim().toLowerCase() } },
      include: INCLUDE_PAPEIS,
    });
    return registro ? UsuarioMapper.paraDominio(registro) : null;
  }

  async contarPorEmpresa(empresaId: string): Promise<number> {
    return this.prisma.usuario.count({ where: { empresaId } });
  }
}
