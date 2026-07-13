import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthTokenService, UsuarioTokenClaims } from './auth-token.service';

/**
 * Lê o Bearer token se presente e válido; devolve `undefined` se ausente ou inválido, sem
 * lançar erro. Usado só onde a rota precisa saber "quem está chamando, se alguém" sem exigir
 * autenticação (Missão 0010, Seção 3 — bootstrap do primeiro Usuário). Rotas que exigem
 * autenticação de verdade usam JwtAuthGuard, não isto.
 */
@Injectable()
export class ExtratorUsuarioOpcional {
  constructor(private readonly authToken: AuthTokenService) {}

  extrair(request: Request): UsuarioTokenClaims | undefined {
    const cabecalho = request.headers.authorization;
    if (!cabecalho?.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      return this.authToken.verificarToken(cabecalho.slice('Bearer '.length));
    } catch {
      return undefined;
    }
  }
}
