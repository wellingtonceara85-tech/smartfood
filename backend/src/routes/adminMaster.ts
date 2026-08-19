import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env';
import { requireAuth, requirePapel } from '../middleware/auth';
import { prisma } from '../prisma';
import { dataExpiracaoConvite, gerarTokenConvite } from '../utils/convite';

export const adminMasterRouter = Router();
adminMasterRouter.use(requireAuth, requirePapel('admin_master'));

function linkAtivacao(tokenBruto: string): string {
  return `${env.frontendUrl}/ativar-conta?token=${tokenBruto}`;
}

adminMasterRouter.get('/lojas', async (_req, res) => {
  const lojas = await prisma.loja.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      _count: { select: { produtos: true, pedidos: true } },
      // Só o suficiente pra saber se o dono já ativou a conta — nunca o hash em si sai daqui.
      usuarios: { where: { papel: 'dono_loja' }, select: { senhaHash: true } },
    },
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
      donoAtivado: loja.usuarios[0]?.senhaHash != null,
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
});

// O Admin Master nunca define nem vê a senha do dono da loja: o usuário é
// criado "aguardando ativação" (senhaHash nulo) e recebe um convite de uso
// único pra definir a própria senha em /ativar-conta.
adminMasterRouter.post('/lojas', async (req, res) => {
  const parsed = criarLojaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const slugEmUso = await prisma.loja.findUnique({ where: { slug: parsed.data.slug } });
  if (slugEmUso) return res.status(400).json({ erro: 'Esse link (slug) já está em uso' });

  const emailEmUso = await prisma.usuario.findUnique({ where: { email: parsed.data.donoEmail } });
  if (emailEmUso) return res.status(400).json({ erro: 'Esse e-mail já está em uso' });

  const { tokenBruto, tokenHash } = gerarTokenConvite();
  const expiraEm = dataExpiracaoConvite();

  const loja = await prisma.loja.create({
    data: {
      nome: parsed.data.nome,
      slug: parsed.data.slug,
      telefoneWhatsapp: parsed.data.telefoneWhatsapp,
      usuarios: {
        create: {
          nome: parsed.data.donoNome,
          email: parsed.data.donoEmail,
          senhaHash: null,
          papel: 'dono_loja',
          convitesAtivacao: {
            create: { tokenHash, expiraEm },
          },
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
    donoAtivado: false,
    linkAtivacao: linkAtivacao(tokenBruto),
  });
});

// Gera um novo link de ativação pro dono da loja — usado tanto pra reenviar
// (link perdido/expirado) quanto, na prática, como reset de senha assistido
// pelo Admin: o token só dá acesso a DEFINIR uma senha, o Admin nunca vê o
// valor. Qualquer convite anterior ainda pendente é revogado.
adminMasterRouter.post('/lojas/:id/convite', async (req, res) => {
  const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const dono = await prisma.usuario.findFirst({
    where: { lojaId: loja.id, papel: 'dono_loja' },
  });
  if (!dono) {
    return res.status(404).json({ erro: 'Nenhum usuário dono encontrado para esta loja' });
  }

  const { tokenBruto, tokenHash } = gerarTokenConvite();
  const expiraEm = dataExpiracaoConvite();

  await prisma.$transaction([
    prisma.conviteAtivacao.updateMany({
      where: { usuarioId: dono.id, usadoEm: null, revogadoEm: null },
      data: { revogadoEm: new Date() },
    }),
    prisma.conviteAtivacao.create({
      data: { usuarioId: dono.id, tokenHash, expiraEm },
    }),
  ]);

  res.status(201).json({ linkAtivacao: linkAtivacao(tokenBruto) });
});
