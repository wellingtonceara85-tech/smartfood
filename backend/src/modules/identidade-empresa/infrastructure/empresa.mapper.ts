import { Empresa as EmpresaPrisma } from '@prisma/client';
import { Empresa } from '../domain/empresa.entity';

/**
 * Converte entre o modelo Prisma (linha de banco) e a Entidade de Domínio
 * (Missão 0007.5, Seção 4.3) — único lugar que conhece os dois formatos ao mesmo tempo.
 */
export class EmpresaMapper {
  static paraDominio(registro: EmpresaPrisma): Empresa {
    return Empresa.reconstituir({
      id: registro.id,
      nome: registro.nome,
      cnpjCpf: registro.cnpjCpf,
      categoriaNegocio: registro.categoriaNegocio,
      telefone: registro.telefone,
      chavePix: registro.chavePix,
      criadaEm: registro.criadaEm,
    });
  }
}
