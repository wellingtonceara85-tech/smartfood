import jwt from 'jsonwebtoken';
import { env } from '../env';

export type Papel = 'dono_loja' | 'admin_master';

export interface TokenPayload {
  sub: string;
  papel: Papel;
  lojaId: string | null;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload & { type?: string } {
  return jwt.verify(token, env.jwtSecret) as TokenPayload & { type?: string };
}
