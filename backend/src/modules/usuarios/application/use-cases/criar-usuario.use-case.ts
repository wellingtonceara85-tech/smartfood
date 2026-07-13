import { ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { verificarMesmaEmpresa } from '../../../../platform/auth/verificar-mesma-empresa';
import { PapelNome } from '../../domain/papel';
import { Usuario } from '../../domain/usuario.entity';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../domain/usuario.repository';
import { CriarUsuarioCommand } from '../dtos/criar-usuario.command';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';

export interface CriarUsuarioResultado {
  usuarioId: string;
}

/**
 * Bootstrap (Missão 0010, Seção 3): se a Empresa ainda não tem nenhum Usuário, a criação é
 * aberta e o Papel é forçado a Administrador — assim que existir 1 Usuário, toda chamada
 * seguinte exige um Administrador autenticado da mesma Empresa.
 */
@Injectable()
export class CriarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly repositorio: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: CriarUsuarioCommand): Promise<CriarUsuarioResultado> {
    const totalUsuariosNaEmpresa = await this.repositorio.contarPorEmpresa(command.empresaId);
    const ehBootstrap = totalUsuariosNaEmpresa === 0;

    if (!ehBootstrap) {
      if (!command.chamador) {
        throw new ForbiddenException(
          'Esta Empresa já tem Usuário — autentique-se para criar um novo.',
        );
      }
      verificarMesmaEmpresa(command.chamador.empresaId, command.empresaId);
      if (command.chamador.papel !== PapelNome.ADMINISTRADOR) {
        throw new ForbiddenException('Só um Administrador pode criar novos Usuários.');
      }
    }

    const existente = await this.repositorio.buscarPorEmailEEmpresa(
      command.email,
      command.empresaId,
    );
    if (existente) {
      throw new ConflictException('Já existe um Usuário com este e-mail nesta Empresa.');
    }

    const senhaHash = await this.hasher.hash(command.senha);
    const papel = ehBootstrap ? PapelNome.ADMINISTRADOR : (command.papel ?? '');

    const usuario = Usuario.criar({
      empresaId: command.empresaId,
      nome: command.nome,
      email: command.email,
      senhaHash,
      papel,
    });

    await this.repositorio.salvar(usuario);

    return { usuarioId: usuario.paraPersistencia().id };
  }
}
