import { BairroEntrega, Pedido, Prisma, Produto } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { lojaIdDoUsuario, requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';
import { HEX_REGEX, normalizarCor } from '../utils/cor';
import { calcularTrial } from '../utils/trial';

const corHexSchema = z
  .string()
  .regex(HEX_REGEX, 'Cor inválida — use o formato #RRGGBB')
  .transform(normalizarCor);

function serializarProduto(produto: Produto) {
  return { ...produto, preco: Number(produto.preco) };
}

function serializarBairro(bairro: BairroEntrega) {
  return { ...bairro, valorEntrega: Number(bairro.valorEntrega) };
}

function serializarPedido(pedido: Pedido) {
  return {
    ...pedido,
    total: Number(pedido.total),
    valorEntrega: Number(pedido.valorEntrega),
    trocoPara: pedido.trocoPara === null ? null : Number(pedido.trocoPara),
  };
}

const STATUS_PEDIDO = ['recebido', 'em_preparo', 'pronto', 'entregue', 'finalizado'] as const;

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
  res.json({ ...loja, trial: calcularTrial(loja.trialInicioEm, loja.trialFimEm) });
});

const atualizarLojaSchema = z.object({
  nome: z.string().min(1).optional(),
  tagline: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  capaUrl: z.string().url().nullable().optional(),
  endereco: z.string().nullable().optional(),
  chavePix: z.string().nullable().optional(),
  telefoneWhatsapp: z.string().min(8).optional(),
  horarioAbertura: z.string().nullable().optional(),
  horarioFechamento: z.string().nullable().optional(),
  abertoManual: z.boolean().nullable().optional(),
  corPrimaria: corHexSchema.optional(),
  corSecundaria: corHexSchema.optional(),
  aceitaAgendamento: z.boolean().optional(),
  antecedenciaMinimaMinutos: z.number().int().nonnegative().optional(),
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

// --- Bairros de entrega ---

adminRouter.get('/bairros', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const bairros = await prisma.bairroEntrega.findMany({
    where: { lojaId },
    orderBy: { nomeBairro: 'asc' },
  });
  res.json(bairros.map(serializarBairro));
});

const bairroSchema = z.object({
  nomeBairro: z.string().min(1),
  valorEntrega: z.number().nonnegative(),
  ativo: z.boolean().optional(),
});

adminRouter.post('/bairros', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = bairroSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const bairro = await prisma.bairroEntrega.create({ data: { ...parsed.data, lojaId } });
  res.status(201).json(serializarBairro(bairro));
});

adminRouter.put('/bairros/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = bairroSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const existente = await prisma.bairroEntrega.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Bairro não encontrado' });

  const bairro = await prisma.bairroEntrega.update({
    where: { id: existente.id },
    data: parsed.data,
  });
  res.json(serializarBairro(bairro));
});

adminRouter.delete('/bairros/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await prisma.bairroEntrega.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Bairro não encontrado' });

  await prisma.bairroEntrega.delete({ where: { id: existente.id } });
  res.status(204).send();
});

// --- Pedidos ---

adminRouter.get('/pedidos', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const pedidos = await prisma.pedido.findMany({
    where: { lojaId },
    orderBy: { criadoEm: 'desc' },
    take: 100,
  });
  res.json(pedidos.map(serializarPedido));
});

const atualizarStatusSchema = z.object({
  status: z.enum(STATUS_PEDIDO),
});

adminRouter.patch('/pedidos/:id/status', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = atualizarStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Status inválido' });

  const existente = await prisma.pedido.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' });

  const pedido = await prisma.pedido.update({
    where: { id: existente.id },
    data: { status: parsed.data.status },
  });
  res.json(serializarPedido(pedido));
});

// --- Dashboard ---

interface ItemPedidoJson {
  nome: string;
  quantidade: number;
}

const dashboardQuerySchema = z.object({
  inicio: z.string().optional(),
  fim: z.string().optional(),
});

adminRouter.get('/dashboard', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = dashboardQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ erro: 'Parâmetros inválidos' });

  const hoje = new Date();
  const inicioPadrao = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicio = parsed.data.inicio ? new Date(`${parsed.data.inicio}T00:00:00`) : inicioPadrao;
  const fim = parsed.data.fim
    ? new Date(`${parsed.data.fim}T23:59:59.999`)
    : new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), 23, 59, 59, 999);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return res.status(400).json({ erro: 'Datas inválidas' });
  }

  const pedidos = await prisma.pedido.findMany({
    where: { lojaId, criadoEm: { gte: inicio, lte: fim } },
  });

  const faturamentoTotal = pedidos.reduce((soma, p) => soma + Number(p.total), 0);
  const totalPedidos = pedidos.length;
  const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;

  const contagemProdutos = new Map<string, number>();
  for (const pedido of pedidos) {
    const itens = pedido.itens as unknown as ItemPedidoJson[];
    for (const item of itens) {
      contagemProdutos.set(item.nome, (contagemProdutos.get(item.nome) ?? 0) + item.quantidade);
    }
  }
  let produtoMaisVendido: { nome: string; quantidade: number } | null = null;
  for (const [nome, quantidade] of contagemProdutos) {
    if (!produtoMaisVendido || quantidade > produtoMaisVendido.quantidade) {
      produtoMaisVendido = { nome, quantidade };
    }
  }

  const clientes = new Map<
    string,
    { nome: string; telefone: string; totalGasto: number; totalPedidos: number }
  >();
  for (const pedido of pedidos) {
    const atual = clientes.get(pedido.clienteTelefone) ?? {
      nome: pedido.clienteNome,
      telefone: pedido.clienteTelefone,
      totalGasto: 0,
      totalPedidos: 0,
    };
    atual.totalGasto += Number(pedido.total);
    atual.totalPedidos += 1;
    atual.nome = pedido.clienteNome;
    clientes.set(pedido.clienteTelefone, atual);
  }
  let clienteTop: {
    nome: string;
    telefone: string;
    totalGasto: number;
    totalPedidos: number;
  } | null = null;
  for (const cliente of clientes.values()) {
    if (!clienteTop || cliente.totalGasto > clienteTop.totalGasto) clienteTop = cliente;
  }

  res.json({
    periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    faturamentoTotal,
    totalPedidos,
    ticketMedio,
    produtoMaisVendido,
    clienteTop,
  });
});
