import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { calcularAberto } from '../utils/horario';
import { montarMensagemPedido } from '../utils/mensagemWhatsapp';

export const publicRouter = Router();

publicRouter.get('/lojas/:slug', async (req, res) => {
  const loja = await prisma.loja.findUnique({
    where: { slug: req.params.slug },
    include: {
      categorias: {
        orderBy: { ordem: 'asc' },
        include: { produtos: true },
      },
    },
  });

  if (!loja) {
    return res.status(404).json({ erro: 'Loja não encontrada' });
  }

  res.json({
    id: loja.id,
    nome: loja.nome,
    slug: loja.slug,
    logoUrl: loja.logoUrl,
    tagline: loja.tagline,
    endereco: loja.endereco,
    telefoneWhatsapp: loja.telefoneWhatsapp,
    aberto: calcularAberto(loja),
    categorias: loja.categorias.map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      ordem: categoria.ordem,
      produtos: categoria.produtos.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        preco: Number(produto.preco),
        fotoUrl: produto.fotoUrl,
        disponivel: produto.disponivel,
        opcoes: produto.opcoes as string[] | null,
      })),
    })),
  });
});

publicRouter.get('/lojas/:slug/pedidos/ultimo', async (req, res) => {
  const telefone = String(req.query.telefone ?? '');
  if (!telefone) {
    return res.status(400).json({ erro: 'Informe o telefone' });
  }

  const loja = await prisma.loja.findUnique({ where: { slug: req.params.slug } });
  if (!loja) {
    return res.status(404).json({ erro: 'Loja não encontrada' });
  }

  const pedido = await prisma.pedido.findFirst({
    where: { lojaId: loja.id, clienteTelefone: telefone },
    orderBy: { criadoEm: 'desc' },
  });

  res.json(pedido ?? null);
});

const itemPedidoSchema = z.object({
  produtoId: z.string().uuid(),
  opcao: z.string().nullable().optional(),
  quantidade: z.number().int().min(1),
});

const criarPedidoSchema = z.object({
  clienteTelefone: z.string().min(8),
  itens: z.array(itemPedidoSchema).min(1),
});

publicRouter.post('/lojas/:slug/pedidos', async (req, res) => {
  const parsed = criarPedidoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const loja = await prisma.loja.findUnique({ where: { slug: req.params.slug } });
  if (!loja) {
    return res.status(404).json({ erro: 'Loja não encontrada' });
  }

  const produtoIds = parsed.data.itens.map((item) => item.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, lojaId: loja.id },
  });
  const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

  const itensResolvidos: {
    produtoId: string;
    nome: string;
    opcao: string | null;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }[] = [];

  for (const item of parsed.data.itens) {
    const produto = produtosPorId.get(item.produtoId);
    if (!produto) {
      return res.status(400).json({ erro: `Produto ${item.produtoId} não encontrado nesta loja` });
    }
    if (!produto.disponivel) {
      return res.status(400).json({ erro: `Produto "${produto.nome}" está indisponível` });
    }

    const precoUnitario = Number(produto.preco);
    const subtotal = precoUnitario * item.quantidade;
    itensResolvidos.push({
      produtoId: produto.id,
      nome: produto.nome,
      opcao: item.opcao ?? null,
      quantidade: item.quantidade,
      precoUnitario,
      subtotal,
    });
  }

  const total = itensResolvidos.reduce((soma, item) => soma + item.subtotal, 0);

  const pedido = await prisma.pedido.create({
    data: {
      lojaId: loja.id,
      clienteTelefone: parsed.data.clienteTelefone,
      itens: itensResolvidos,
      total,
    },
  });

  const mensagem = montarMensagemPedido(loja.nome, itensResolvidos, total);
  const linkWhatsapp = `https://wa.me/${loja.telefoneWhatsapp}?text=${encodeURIComponent(mensagem)}`;

  res.status(201).json({ pedido, mensagem, linkWhatsapp });
});
