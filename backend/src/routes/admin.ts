import { Prisma, Produto } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { lojaIdDoUsuario, requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';

function serializarProduto(produto: Produto) {
  return { ...produto, preco: Number(produto.preco) };
}

export const adminRouter = Router();
adminRouter.use(requireAuth);

function lojaIdOuErro(
  req: Parameters<typeof lojaIdDoUsuario>[0],
  res: import('express').Response,
): string | null {
  const lojaId = lojaIdDoUsuario(req);
  if (!lojaId) {
    res.status(403).json({ erro: 'Usuário não está vinculado a nenhuma loja' });
    return null;
  }
  return lojaId;
}

// --- Loja ---

adminRouter.get('/loja', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });
  res.json(loja);
});

const atualizarLojaSchema = z.object({
  nome: z.string().min(1).optional(),
  tagline: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  endereco: z.string().nullable().optional(),
  telefoneWhatsapp: z.string().min(8).optional(),
  horarioAbertura: z.string().nullable().optional(),
  horarioFechamento: z.string().nullable().optional(),
  abertoManual: z.boolean().nullable().optional(),
});

adminRouter.put('/loja', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = atualizarLojaSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const loja = await prisma.loja.update({ where: { id: lojaId }, data: parsed.data });
  res.json(loja);
});

// --- Categorias ---

adminRouter.get('/categorias', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const categorias = await prisma.categoria.findMany({
    where: { lojaId },
    orderBy: { ordem: 'asc' },
  });
  res.json(categorias);
});

const categoriaSchema = z.object({
  nome: z.string().min(1),
  ordem: z.number().int().optional(),
});

adminRouter.post('/categorias', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = categoriaSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const categoria = await prisma.categoria.create({ data: { ...parsed.data, lojaId } });
  res.status(201).json(categoria);
});

adminRouter.put('/categorias/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = categoriaSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const existente = await prisma.categoria.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada' });

  const categoria = await prisma.categoria.update({
    where: { id: existente.id },
    data: parsed.data,
  });
  res.json(categoria);
});

adminRouter.delete('/categorias/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await prisma.categoria.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada' });

  await prisma.categoria.delete({ where: { id: existente.id } });
  res.status(204).send();
});

// --- Produtos ---

adminRouter.get('/produtos', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const produtos = await prisma.produto.findMany({
    where: { lojaId },
    orderBy: { criadoEm: 'desc' },
  });
  res.json(produtos.map(serializarProduto));
});

const produtoSchema = z.object({
  categoriaId: z.string().uuid(),
  nome: z.string().min(1),
  descricao: z.string().nullable().optional(),
  preco: z.number().positive(),
  fotoUrl: z.string().url().nullable().optional(),
  disponivel: z.boolean().optional(),
  opcoes: z.array(z.string()).nullable().optional(),
});

adminRouter.post('/produtos', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = produtoSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const categoria = await prisma.categoria.findFirst({
    where: { id: parsed.data.categoriaId, lojaId },
  });
  if (!categoria) return res.status(400).json({ erro: 'Categoria inválida para esta loja' });

  const produto = await prisma.produto.create({
    data: {
      lojaId,
      categoriaId: parsed.data.categoriaId,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      preco: parsed.data.preco,
      fotoUrl: parsed.data.fotoUrl ?? null,
      disponivel: parsed.data.disponivel ?? true,
      opcoes: parsed.data.opcoes ?? Prisma.JsonNull,
    },
  });
  res.status(201).json(serializarProduto(produto));
});

adminRouter.put('/produtos/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = produtoSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const existente = await prisma.produto.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });

  if (parsed.data.categoriaId) {
    const categoria = await prisma.categoria.findFirst({
      where: { id: parsed.data.categoriaId, lojaId },
    });
    if (!categoria) return res.status(400).json({ erro: 'Categoria inválida para esta loja' });
  }

  const { opcoes, ...resto } = parsed.data;
  const produto = await prisma.produto.update({
    where: { id: existente.id },
    data: {
      ...resto,
      ...(opcoes !== undefined ? { opcoes: opcoes ?? Prisma.JsonNull } : {}),
    },
  });
  res.json(serializarProduto(produto));
});

adminRouter.patch('/produtos/:id/disponibilidade', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = z.object({ disponivel: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados inválidos' });

  const existente = await prisma.produto.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });

  const produto = await prisma.produto.update({
    where: { id: existente.id },
    data: { disponivel: parsed.data.disponivel },
  });
  res.json(serializarProduto(produto));
});

adminRouter.delete('/produtos/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await prisma.produto.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });

  await prisma.produto.delete({ where: { id: existente.id } });
  res.status(204).send();
});
