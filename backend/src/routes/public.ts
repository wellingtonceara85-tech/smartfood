import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env';
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
      bairrosEntrega: {
        where: { ativo: true },
        orderBy: { nomeBairro: 'asc' },
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
    capaUrl: loja.capaUrl,
    tagline: loja.tagline,
    endereco: loja.endereco,
    chavePix: loja.chavePix,
    telefoneWhatsapp: loja.telefoneWhatsapp,
    aberto: calcularAberto(loja),
    bairrosEntrega: loja.bairrosEntrega.map((bairro) => ({
      id: bairro.id,
      nomeBairro: bairro.nomeBairro,
      valorEntrega: Number(bairro.valorEntrega),
    })),
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

publicRouter.get('/lojas/:slug/pedidos/:id', async (req, res) => {
  const loja = await prisma.loja.findUnique({ where: { slug: req.params.slug } });
  if (!loja) {
    return res.status(404).json({ erro: 'Loja não encontrada' });
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id: req.params.id, lojaId: loja.id },
  });
  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }

  res.json({
    id: pedido.id,
    numero: pedido.numero,
    status: pedido.status,
    itens: pedido.itens,
    formaRecebimento: pedido.formaRecebimento,
    bairroEntregaNome: pedido.bairroEntregaNome,
    total: Number(pedido.total),
    criadoEm: pedido.criadoEm,
    loja: { nome: loja.nome },
  });
});

const itemPedidoSchema = z.object({
  produtoId: z.string().uuid(),
  opcao: z.string().nullable().optional(),
  quantidade: z.number().int().min(1),
});

const criarPedidoSchema = z.object({
  clienteNome: z.string().min(1),
  clienteTelefone: z.string().min(8),
  itens: z.array(itemPedidoSchema).min(1),
  formaRecebimento: z.enum(['entrega', 'retirada']),
  bairroEntregaId: z.string().uuid().nullable().optional(),
  formaPagamento: z.enum(['dinheiro', 'cartao', 'pix']),
  precisaTroco: z.boolean().nullable().optional(),
  trocoPara: z.number().positive().nullable().optional(),
  tipoCartao: z.enum(['debito', 'credito']).nullable().optional(),
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

  const subtotalItens = itensResolvidos.reduce((soma, item) => soma + item.subtotal, 0);

  let valorEntrega = 0;
  let bairroEntregaNome: string | null = null;

  if (parsed.data.formaRecebimento === 'entrega') {
    if (!parsed.data.bairroEntregaId) {
      return res.status(400).json({ erro: 'Selecione um bairro para entrega' });
    }
    const bairro = await prisma.bairroEntrega.findFirst({
      where: { id: parsed.data.bairroEntregaId, lojaId: loja.id, ativo: true },
    });
    if (!bairro) {
      return res.status(400).json({ erro: 'Bairro de entrega inválido para esta loja' });
    }
    valorEntrega = Number(bairro.valorEntrega);
    bairroEntregaNome = bairro.nomeBairro;
  }

  const total = subtotalItens + valorEntrega;

  if (parsed.data.formaPagamento === 'cartao' && !parsed.data.tipoCartao) {
    return res.status(400).json({ erro: 'Selecione débito ou crédito' });
  }
  if (
    parsed.data.formaPagamento === 'dinheiro' &&
    parsed.data.precisaTroco &&
    (!parsed.data.trocoPara || parsed.data.trocoPara <= total)
  ) {
    return res.status(400).json({ erro: 'Informe um valor de troco maior que o total do pedido' });
  }

  const numero = (await prisma.pedido.count({ where: { lojaId: loja.id } })) + 1;

  const pedido = await prisma.pedido.create({
    data: {
      lojaId: loja.id,
      numero,
      clienteNome: parsed.data.clienteNome,
      clienteTelefone: parsed.data.clienteTelefone,
      itens: itensResolvidos,
      formaRecebimento: parsed.data.formaRecebimento,
      bairroEntregaId:
        parsed.data.formaRecebimento === 'entrega' ? parsed.data.bairroEntregaId : null,
      bairroEntregaNome,
      valorEntrega,
      formaPagamento: parsed.data.formaPagamento,
      precisaTroco:
        parsed.data.formaPagamento === 'dinheiro' ? (parsed.data.precisaTroco ?? false) : null,
      trocoPara:
        parsed.data.formaPagamento === 'dinheiro' && parsed.data.precisaTroco
          ? parsed.data.trocoPara
          : null,
      tipoCartao: parsed.data.formaPagamento === 'cartao' ? parsed.data.tipoCartao : null,
      total,
    },
  });

  const linkAcompanhamento = `${env.frontendUrl}/${loja.slug}/pedido/${pedido.id}`;
  const mensagem = montarMensagemPedido(
    loja.nome,
    itensResolvidos,
    total,
    {
      forma: parsed.data.formaRecebimento,
      bairroNome: bairroEntregaNome,
      valorEntrega,
    },
    {
      numero,
      clienteNome: parsed.data.clienteNome,
      clienteTelefone: parsed.data.clienteTelefone,
      formaPagamento: parsed.data.formaPagamento,
      precisaTroco: parsed.data.precisaTroco ?? false,
      trocoPara: parsed.data.trocoPara ?? null,
      tipoCartao: parsed.data.tipoCartao ?? null,
      chavePix: loja.chavePix,
      linkAcompanhamento,
    },
  );
  const linkWhatsapp = `https://wa.me/${loja.telefoneWhatsapp}?text=${encodeURIComponent(mensagem)}`;

  res.status(201).json({ pedido, mensagem, linkWhatsapp });
});
