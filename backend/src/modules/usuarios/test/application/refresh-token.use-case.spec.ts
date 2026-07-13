import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AuthTokenService } from '../../../../platform/auth/auth-token.service';
import { obterJwtSecret } from '../../../../platform/auth/jwt-secret';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';

describe('RefreshTokenUseCase (integração — JwtService real)', () => {
  async function montar() {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: obterJwtSecret() })],
      providers: [AuthTokenService, RefreshTokenUseCase],
    }).compile();

    return {
      authToken: moduleRef.get(AuthTokenService),
      useCase: moduleRef.get(RefreshTokenUseCase),
    };
  }

  it('troca um Refresh Token válido por um novo Access Token', async () => {
    const { authToken, useCase } = await montar();
    const { refreshToken } = authToken.emitirParDeTokens({
      usuarioId: 'usuario-1',
      empresaId: 'empresa-1',
      papel: 'Administrador',
    });

    const resultado = useCase.execute(refreshToken);

    expect(resultado.accessToken).toBeDefined();
    expect(authToken.verificarToken(resultado.accessToken)).toMatchObject({
      usuarioId: 'usuario-1',
      empresaId: 'empresa-1',
      papel: 'Administrador',
    });
  });

  it('rejeita um token inválido', async () => {
    const { useCase } = await montar();
    expect(() => useCase.execute('token-invalido')).toThrow(/inválido ou expirado/i);
  });
});
