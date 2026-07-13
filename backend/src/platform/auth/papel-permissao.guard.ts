import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuarioTokenClaims } from './auth-token.service';
import { PAPEIS_PERMITIDOS_KEY } from './papeis-permitidos.decorator';

/**
 * Só checa o nome do Papel — a checagem "mesma Empresa" (Missão 0004, Invariante 6) é
 * responsabilidade do Controller/Caso de Uso, que conhece a Empresa dona do recurso
 * (ver verificar-mesma-empresa.ts). Deve rodar sempre depois de JwtAuthGuard.
 */
@Injectable()
export class PapelPermissaoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeisPermitidos = this.reflector.get<string[] | undefined>(
      PAPEIS_PERMITIDOS_KEY,
      context.getHandler(),
    );

    if (!papeisPermitidos || papeisPermitidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user as UsuarioTokenClaims | undefined;

    if (!usuario || !papeisPermitidos.includes(usuario.papel)) {
      throw new ForbiddenException('Papel não autorizado para esta ação.');
    }

    return true;
  }
}
