import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requirePapel } from '../middleware/auth';
import { prisma } from '../prisma';

export const adminMasterRouter = Router();
adminMasterRouter.use(requireAuth, requirePapel('admin_master'));

adminMasterRouter.get('/lojas', async (_req, res) => {
  const lojas = await prisma.loja.findMany({
    orderBy: { criadoEm: 'desc' },
    include: { _count: { select: { produtos: true, pedidos: true } } },
  });

  res.json(
    lojas.map((loja) => ({
      id: loja.id,
      nome: loja.nome,
      slug: loja.slug,
      telefoneWhatsapp: loja.telefoneWhatsapp,
      criadoEm: loja.criadoEm,
      totalProdutos: loja._count.produtos,
      totalPedidos: loja._count.pedidos,
    })),
  );
});

const criarLojaSchema = z.object({
  nome: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  telefoneWhatsapp: z.string().min(8),
  donoNome: z.string().min(1),
  donoEmail: z.string().email(),
  donoSenha: z.string().min(6),
});

adminMasterRouter.post('/lojas', async (req, res) => {
  const parsed = criarLojaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const slugEmUso = await prisma.loja.findUnique({ where: { slug: parsed.data.slug } });
  if (slugEmUso) return res.status(400).json({ erro: 'Esse link (slug) já está em uso' });

  const emailEmUso = await prisma.usuario.findUnique({ where: { email: parsed.data.donoEmail } });
  if (emailEmUso) return res.status(400).json({ erro: 'Esse e-mail já está em uso' });

  const senhaHash = await bcrypt.hash(parsed.data.donoSenha, 10);

  const loja = await prisma.loja.create({
    data: {
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      telefoneWhatsapp: parsed.data.telefoneWhatsapp,
      usuarios: {
        create: {
          nome: parsed.data.donoNome,
          email: parsed.data.donoEmail,
          senhaHash,
          papel: 'dono_loja',
        },
      },
    },
  });

  res.status(201).json({
    id: loja.id,
    nome: loja.nome,
    slug: loja.slug,
    telefoneWhatsapp: loja.telefoneWhatsapp,
    criadoEm: loja.criadoEm,
    totalProdutos: 0,
    totalPedidos: 0,
  });
});
