import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** Claims do fluxo de Autenticação de Usuário (ADR-0024) — nunca usado para o fluxo de Cliente. */
export interface UsuarioTokenClaims {
  usuarioId: string;
  empresaId: string;
  papel: string;
}

export interface ParDeTokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_EXPIRACAO = '30m';
const REFRESH_TOKEN_EXPIRACAO = '7d';

/**
 * Mecanismo de emissão/verificação de JWT — Serviço Compartilhado (platform/), não lógica de
 * negócio de Usuário. Refresh Token nesta missão é stateless: validado só por assinatura e
 * expiração, sem tabela de revogação (Missão 0010, Seção 2 — Fora desta missão).
 */
@Injectable()
export class AuthTokenService {
  constructor(private readonly jwt: JwtService) {}

  emitirParDeTokens(claims: UsuarioTokenClaims): ParDeTokens {
    return {
      accessToken: this.jwt.sign(claims, { expiresIn: ACCESS_TOKEN_EXPIRACAO }),
      refreshToken: this.jwt.sign(claims, { expiresIn: REFRESH_TOKEN_EXPIRACAO }),
    };
  }

  emitirAccessToken(claims: UsuarioTokenClaims): string {
    return this.jwt.sign(claims, { expiresIn: ACCESS_TOKEN_EXPIRACAO });
  }

  /**
   * Verifica qualquer token emitido por este serviço — Access e Refresh usam o mesmo segredo e
   * formato. Devolve só os claims de negócio: `jwt.verify` inclui `iat`/`exp` no payload
   * decodificado, e reassinar esse objeto direto (ex.: emitir novo Access Token a partir de um
   * Refresh Token) falha porque a lib recusa `expiresIn` quando o payload já tem `exp`.
   */
  verificarToken(token: string): UsuarioTokenClaims {
    const payload = this.jwt.verify<UsuarioTokenClaims>(token);
    return { usuarioId: payload.usuarioId, empresaId: payload.empresaId, papel: payload.papel };
  }
}
