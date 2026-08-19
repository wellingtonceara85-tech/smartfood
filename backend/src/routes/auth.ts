import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { email, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  // Usuário criado pelo Admin Master mas que ainda não ativou a conta —
  // não tem senha pra comparar (nunca existiu texto puro nem hash provisório).
  if (!usuario.senhaHash) {
    return res.status(401).json({
      erro: 'Conta aguardando ativação. Use o link de ativação enviado para definir sua senha.',
    });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const payload = { sub: usuario.id, papel: usuario.papel, lojaId: usuario.lojaId };
  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      lojaId: usuario.lojaId,
    },
  });
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

authRouter.post('/refresh', (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  try {
    const payload = verifyToken(parsed.data.refreshToken);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ erro: 'Token inválido' });
    }
    const accessToken = signAccessToken({
      sub: payload.sub,
      papel: payload.papel,
      lojaId: payload.lojaId,
    });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ erro: 'Refresh token inválido ou expirado' });
  }
});
