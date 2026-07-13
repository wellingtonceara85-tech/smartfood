import type {
  Papel as PapelPrisma,
  Usuario as UsuarioPrisma,
  UsuarioPapel as UsuarioPapelPrisma,
} from '@prisma/client';
import { PapelNome } from '../domain/papel';
import { Usuario } from '../domain/usuario.entity';

type UsuarioComPapeis = UsuarioPrisma & {
  papeis: (UsuarioPapelPrisma & { papel: PapelPrisma })[];
};

export class UsuarioMapper {
  static paraDominio(registro: UsuarioComPapeis): Usuario {
    const nomePapel = registro.papeis[0]?.papel.nome as PapelNome;

    return Usuario.reconstituir({
      id: registro.id,
      empresaId: registro.empresaId,
      nome: registro.nome,
      email: registro.email,
      senhaHash: registro.senhaHash,
      papel: nomePapel,
      criadoEm: registro.criadoEm,
    });
  }
}
