import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { lojaIdDoUsuario, requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';

export const sugestoesRouter = Router();
sugestoesRouter.use(requireAuth);

function lojaIdOuErro(req: Request, res: Response): string | null {
  const lojaId = lojaIdDoUsuario(req);
  if (!lojaId) {
    res.status(403).json({ erro: 'Usuário não está vinculado a nenhuma loja' });
    return null;
  }
  return lojaId;
}

const criarSugestaoSchema = z.object({
  categoria: z.enum(['cardapio', 'pedidos', 'financeiro', 'entregas', 'relatorios', 'outro']),
  mensagem: z.string().trim().min(3, 'Conte um pouco mais sobre a sua ideia').max(2000),
});

sugestoesRouter.post('/', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = criarSugestaoSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const sugestao = await prisma.sugestaoLojista.create({
    data: { ...parsed.data, lojaId, usuarioId: req.user?.sub ?? null },
  });
  res.status(201).json(sugestao);
});

sugestoesRouter.get('/', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const sugestoes = await prisma.sugestaoLojista.findMany({
    where: { lojaId },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(sugestoes);
});
