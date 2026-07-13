import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from '../../../../platform/auth/auth-token.service';

export interface RefreshTokenResultado {
  accessToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly authToken: AuthTokenService) {}

  execute(refreshToken: string): RefreshTokenResultado {
    try {
      const claims = this.authToken.verificarToken(refreshToken);
      return { accessToken: this.authToken.emitirAccessToken(claims) };
    } catch {
      throw new UnauthorizedException('Refresh Token inválido ou expirado.');
    }
  }
}
