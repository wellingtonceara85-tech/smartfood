import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService, ParDeTokens } from '../../../../platform/auth/auth-token.service';
import { USUARIO_REPOSITORY, UsuarioRepository } from '../../domain/usuario.repository';
import { LoginCommand } from '../dtos/login.command';
import { PASSWORD_HASHER, PasswordHasher } from '../ports/password-hasher.port';

const MENSAGEM_CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly repositorio: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly authToken: AuthTokenService,
  ) {}

  async execute(command: LoginCommand): Promise<ParDeTokens> {
    const usuario = await this.repositorio.buscarPorEmailEEmpresa(command.email, command.empresaId);
    if (!usuario) {
      throw new UnauthorizedException(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    const dados = usuario.paraPersistencia();
    const senhaCorreta = await this.hasher.comparar(command.senha, dados.senhaHash);
    if (!senhaCorreta) {
      throw new UnauthorizedException(MENSAGEM_CREDENCIAIS_INVALIDAS);
    }

    return this.authToken.emitirParDeTokens({
      usuarioId: dados.id,
      empresaId: dados.empresaId,
      papel: dados.papel,
    });
  }
}
