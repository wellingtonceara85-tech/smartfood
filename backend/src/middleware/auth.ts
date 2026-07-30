import { NextFunction, Request, Response } from 'express';
import { Papel, TokenPayload, verifyToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token ausente' });
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

export function requirePapel(...papeis: Papel[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !papeis.includes(req.user.papel)) {
      return res.status(403).json({ erro: 'Sem permissão para este recurso' });
    }
    next();
  };
}

/** Resolve o loja_id que o usuário autenticado pode operar (admin_master ainda precisa informar qual loja). */
export function lojaIdDoUsuario(req: Request): string | null {
  return req.user?.lojaId ?? null;
}
