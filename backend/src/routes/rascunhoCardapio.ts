import path from 'node:path';
import { Prisma, RascunhoCategoria, RascunhoProduto } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { lojaIdDoUsuario, requireAuth } from '../middleware/auth';
import {
  criarMulterLocal,
  receberArquivoDeRawBody,
  rodandoNoCloudFunctions,
} from '../multipartUpload';
import { prisma } from '../prisma';
import { parseCsv } from '../utils/csvSimples';
import { lerLinhasXlsx } from '../utils/lerXlsx';
import { proximaOrdem } from '../utils/ordenacao';
import { parsePlanilhaCardapio } from '../utils/parserPlanilhaCardapio';
import { parseTextoCardapio } from '../utils/parserTextoCardapio';
import { idsPossivelmenteDuplicados, montarResumoRascunho } from '../utils/validacaoRascunho';

export const rascunhoCardapioRouter = Router();
rascunhoCardapioRouter.use(requireAuth);

const CATEGORIA_PADRAO = 'Sem categoria';
const LIMITE_PLANILHA_BYTES = 3 * 1024 * 1024;

function lojaIdOuErro(req: Request, res: Response): string | null {
  const lojaId = lojaIdDoUsuario(req);
  if (!lojaId) {
    res.status(403).json({ erro: 'Usuário não está vinculado a nenhuma loja' });
    return null;
  }
  return lojaId;
}

function serializarProduto(produto: RascunhoProduto) {
  return { ...produto, preco: produto.preco === null ? null : Number(produto.preco) };
}

interface ItemParaAdicionar {
  categoria: string | null;
  nome: string | null;
  descricao: string | null;
  preco: number | null;
  precoTexto: string | null;
  disponivel: boolean;
  precisaRevisao: boolean;
  motivosRevisao: string[];
}

async function obterRascunhoAtivo(lojaId: string) {
  return prisma.rascunhoCardapio.findFirst({
    where: { lojaId, status: 'rascunho' },
    include: {
      categorias: { orderBy: { ordem: 'asc' } },
      produtos: { orderBy: { ordem: 'asc' } },
    },
  });
}

/** Cria o rascunho ativo se não existir, adiciona os itens (bucketando sem categoria em "Sem categoria"), e recalcula duplicados ao final. */
async function adicionarItensAoRascunho(
  lojaId: string,
  origem: 'planilha' | 'colar_texto',
  itens: ItemParaAdicionar[],
) {
  let rascunho = await obterRascunhoAtivo(lojaId);
  if (!rascunho) {
    rascunho = await prisma.rascunhoCardapio.create({
      data: { lojaId, origem },
      include: { categorias: true, produtos: true },
    });
  }

  const categoriasPorNome = new Map<string, RascunhoCategoria>(
    rascunho.categorias.map((c) => [c.nome.trim().toLowerCase(), c]),
  );
  let proximaOrdemCategoria = rascunho.categorias.length;
  let proximaOrdemProduto = proximaOrdem(rascunho.produtos);

  for (const item of itens) {
    const nomeCategoria = (item.categoria?.trim() || CATEGORIA_PADRAO).trim();
    const chave = nomeCategoria.toLowerCase();
    let categoria = categoriasPorNome.get(chave);
    if (!categoria) {
      categoria = await prisma.rascunhoCategoria.create({
        data: { rascunhoId: rascunho.id, nome: nomeCategoria, ordem: proximaOrdemCategoria++ },
      });
      categoriasPorNome.set(chave, categoria);
    }

    await prisma.rascunhoProduto.create({
      data: {
        rascunhoId: rascunho.id,
        rascunhoCategoriaId: categoria.id,
        nome: item.nome,
        descricao: item.descricao,
        preco: item.preco,
        precoTexto: item.precoTexto,
        disponivel: item.disponivel,
        precisaRevisao: item.precisaRevisao,
        motivosRevisao: item.motivosRevisao,
        ordem: proximaOrdemProduto++,
      },
    });
  }

  await recalcularDuplicados(rascunho.id);
  return rascunho.id;
}

async function recalcularDuplicados(rascunhoId: string) {
  const pendentes = await prisma.rascunhoProduto.findMany({
    where: { rascunhoId, publicado: false },
    select: { id: true, nome: true, descricao: true, preco: true, fotoUrl: true, publicado: true },
  });
  const duplicadosIds = idsPossivelmenteDuplicados(
    pendentes.map((p) => ({ ...p, preco: p.preco === null ? null : Number(p.preco) })),
  );

  await prisma.$transaction([
    prisma.rascunhoProduto.updateMany({
      where: { id: { in: [...duplicadosIds] } },
      data: { possivelDuplicado: true },
    }),
    prisma.rascunhoProduto.updateMany({
      where: { rascunhoId, publicado: false, id: { notIn: [...duplicadosIds] } },
      data: { possivelDuplicado: false },
    }),
  ]);
}

// --- Planilha (XLSX/CSV) ---

const uploadPlanilhaLocal = criarMulterLocal({
  maxBytes: LIMITE_PLANILHA_BYTES,
  mimetypesPermitidos: [],
});

async function processarPlanilha(
  lojaId: string,
  buffer: Buffer,
  nomeOriginal: string,
  res: Response,
) {
  const extensao = path.extname(nomeOriginal).toLowerCase();
  let linhas: Record<string, unknown>[];

  if (extensao === '.xlsx') {
    linhas = await lerLinhasXlsx(buffer);
  } else if (extensao === '.csv') {
    linhas = parseCsv(buffer.toString('utf8'));
  } else {
    return res.status(400).json({ erro: 'Envie um arquivo .xlsx ou .csv' });
  }

  if (linhas.length === 0) {
    return res.status(400).json({ erro: 'A planilha está vazia ou não pôde ser lida' });
  }

  const itens = parsePlanilhaCardapio(linhas);
  const rascunhoId = await adicionarItensAoRascunho(lojaId, 'planilha', itens);
  res.status(201).json({ rascunhoId, itensImportados: itens.length });
}

if (rodandoNoCloudFunctions) {
  rascunhoCardapioRouter.post('/planilha', async (req, res) => {
    const lojaId = lojaIdOuErro(req, res);
    if (!lojaId) return;
    try {
      const arquivo = await receberArquivoDeRawBody(req, 'arquivo', {
        maxBytes: LIMITE_PLANILHA_BYTES,
        mimetypesPermitidos: [],
      });
      if (!arquivo) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      await processarPlanilha(lojaId, arquivo.buffer, arquivo.nomeOriginal, res);
    } catch (error) {
      res
        .status(400)
        .json({ erro: error instanceof Error ? error.message : 'Erro ao importar planilha' });
    }
  });
} else {
  rascunhoCardapioRouter.post(
    '/planilha',
    uploadPlanilhaLocal.single('arquivo'),
    async (req, res) => {
      const lojaId = lojaIdOuErro(req, res);
      if (!lojaId) return;
      if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      try {
        await processarPlanilha(lojaId, req.file.buffer, req.file.originalname, res);
      } catch (error) {
        res
          .status(400)
          .json({ erro: error instanceof Error ? error.message : 'Erro ao importar planilha' });
      }
    },
  );
}

// --- Colar texto ---

const colarTextoSchema = z.object({
  texto: z.string().trim().min(1).max(20000),
});

rascunhoCardapioRouter.post('/colar-texto', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = colarTextoSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const itens = parseTextoCardapio(parsed.data.texto).map((item) => ({
    categoria: null,
    nome: item.nome,
    descricao: item.descricao,
    preco: item.preco,
    precoTexto: item.precoTexto,
    disponivel: true,
    precisaRevisao: item.precisaRevisao,
    motivosRevisao: item.motivosRevisao,
  }));

  if (itens.length === 0) {
    return res.status(400).json({ erro: 'Nenhum item reconhecido no texto colado' });
  }

  const rascunhoId = await adicionarItensAoRascunho(lojaId, 'colar_texto', itens);
  res.status(201).json({ rascunhoId, itensImportados: itens.length });
});

// --- Consulta ---

rascunhoCardapioRouter.get('/', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const rascunho = await obterRascunhoAtivo(lojaId);
  if (!rascunho) return res.json(null);

  const pendentes = rascunho.produtos.filter((p) => !p.publicado);
  res.json({
    id: rascunho.id,
    origem: rascunho.origem,
    status: rascunho.status,
    categorias: rascunho.categorias,
    produtos: rascunho.produtos.map(serializarProduto),
    resumo: montarResumoRascunho(
      pendentes.map((p) => ({ ...p, preco: p.preco === null ? null : Number(p.preco) })),
      rascunho.categorias.length,
    ),
  });
});

// --- Categorias do rascunho ---

const categoriaRascunhoSchema = z.object({ nome: z.string().trim().min(1) });

rascunhoCardapioRouter.post('/categorias', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const rascunho = await obterRascunhoAtivo(lojaId);
  if (!rascunho) return res.status(404).json({ erro: 'Nenhum rascunho ativo' });

  const parsed = categoriaRascunhoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados inválidos' });

  const categoria = await prisma.rascunhoCategoria.create({
    data: {
      rascunhoId: rascunho.id,
      nome: parsed.data.nome,
      ordem: proximaOrdem(rascunho.categorias),
    },
  });
  res.status(201).json(categoria);
});

async function categoriaDoRascunhoAtivo(lojaId: string, categoriaId: string) {
  return prisma.rascunhoCategoria.findFirst({
    where: { id: categoriaId, rascunho: { lojaId, status: 'rascunho' } },
  });
}

rascunhoCardapioRouter.put('/categorias/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await categoriaDoRascunhoAtivo(lojaId, req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada' });

  const parsed = z
    .object({ nome: z.string().trim().min(1).optional(), ordem: z.number().int().optional() })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados inválidos' });

  const categoria = await prisma.rascunhoCategoria.update({
    where: { id: existente.id },
    data: parsed.data,
  });
  res.json(categoria);
});

rascunhoCardapioRouter.delete('/categorias/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await categoriaDoRascunhoAtivo(lojaId, req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada' });

  await prisma.$transaction([
    prisma.rascunhoProduto.updateMany({
      where: { rascunhoCategoriaId: existente.id },
      data: { rascunhoCategoriaId: null },
    }),
    prisma.rascunhoCategoria.delete({ where: { id: existente.id } }),
  ]);
  res.status(204).send();
});

// --- Produtos do rascunho ---

async function produtoDoRascunhoAtivo(lojaId: string, produtoId: string) {
  return prisma.rascunhoProduto.findFirst({
    where: { id: produtoId, rascunho: { lojaId, status: 'rascunho' } },
  });
}

const editarProdutoRascunhoSchema = z.object({
  nome: z.string().trim().min(1).nullable().optional(),
  descricao: z.string().nullable().optional(),
  preco: z.number().positive().nullable().optional(),
  fotoUrl: z.string().url().nullable().optional(),
  disponivel: z.boolean().optional(),
  rascunhoCategoriaId: z.string().uuid().nullable().optional(),
});

rascunhoCardapioRouter.put('/produtos/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await produtoDoRascunhoAtivo(lojaId, req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });

  const parsed = editarProdutoRascunhoSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  if (parsed.data.rascunhoCategoriaId) {
    const categoria = await categoriaDoRascunhoAtivo(lojaId, parsed.data.rascunhoCategoriaId);
    if (!categoria) return res.status(400).json({ erro: 'Categoria inválida para este rascunho' });
  }

  const dadosAtualizados: Prisma.RascunhoProdutoUpdateInput = { ...parsed.data };
  // Editar manualmente resolve a pendência de revisão que motivou o campo estar em branco/estranho.
  if (parsed.data.nome !== undefined || parsed.data.preco !== undefined) {
    const nomeFinal = parsed.data.nome !== undefined ? parsed.data.nome : existente.nome;
    const precoFinal = parsed.data.preco !== undefined ? parsed.data.preco : existente.preco;
    dadosAtualizados.precisaRevisao = !nomeFinal?.trim() || precoFinal === null;
    dadosAtualizados.motivosRevisao = dadosAtualizados.precisaRevisao
      ? (existente.motivosRevisao ?? [])
      : [];
  }

  const produto = await prisma.rascunhoProduto.update({
    where: { id: existente.id },
    data: dadosAtualizados,
  });
  await recalcularDuplicados(existente.rascunhoId);
  res.json(serializarProduto(produto));
});

rascunhoCardapioRouter.delete('/produtos/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await produtoDoRascunhoAtivo(lojaId, req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });

  await prisma.rascunhoProduto.delete({ where: { id: existente.id } });
  await recalcularDuplicados(existente.rascunhoId);
  res.status(204).send();
});

// --- Publicar / descartar ---

// Preço/nome inválidos bloqueiam só o item — os demais são publicados normalmente
// (podem ser corrigidos depois e publicados numa chamada seguinte).
rascunhoCardapioRouter.post('/publicar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const rascunho = await obterRascunhoAtivo(lojaId);
  if (!rascunho) return res.status(404).json({ erro: 'Nenhum rascunho ativo' });

  const categoriasReais = await prisma.categoria.findMany({ where: { lojaId } });
  const categoriaPorNome = new Map(categoriasReais.map((c) => [c.nome.trim().toLowerCase(), c]));
  let proximaOrdemCategoriaReal = proximaOrdem(categoriasReais);
  const ordemPorCategoriaReal = new Map<string, number>();

  const categoriaPorId = new Map(rascunho.categorias.map((c) => [c.id, c]));
  const pendentes = rascunho.produtos.filter((p) => !p.publicado);

  let publicados = 0;
  for (const item of pendentes) {
    const nome = item.nome?.trim();
    const preco = item.preco === null ? null : Number(item.preco);
    if (!nome || preco === null || preco <= 0) continue;

    const nomeCategoria = (
      (item.rascunhoCategoriaId ? categoriaPorId.get(item.rascunhoCategoriaId)?.nome : null) ??
      CATEGORIA_PADRAO
    ).trim();
    const chaveCategoria = nomeCategoria.toLowerCase();

    let categoriaReal = categoriaPorNome.get(chaveCategoria);
    if (!categoriaReal) {
      categoriaReal = await prisma.categoria.create({
        data: { lojaId, nome: nomeCategoria, ordem: proximaOrdemCategoriaReal++ },
      });
      categoriaPorNome.set(chaveCategoria, categoriaReal);
    }

    const ordemProduto =
      ordemPorCategoriaReal.get(categoriaReal.id) ??
      (await proximaOrdemNaCategoriaReal(categoriaReal.id));
    ordemPorCategoriaReal.set(categoriaReal.id, ordemProduto + 1);

    const produtoReal = await prisma.produto.create({
      data: {
        lojaId,
        categoriaId: categoriaReal.id,
        nome,
        descricao: item.descricao,
        preco,
        fotoUrl: item.fotoUrl,
        disponivel: item.disponivel,
        ordem: ordemProduto,
      },
    });

    await prisma.rascunhoProduto.update({
      where: { id: item.id },
      data: { publicado: true, produtoRealId: produtoReal.id },
    });
    publicados += 1;
  }

  const totalPendentesRestantes = pendentes.length - publicados;
  if (totalPendentesRestantes === 0) {
    await prisma.rascunhoCardapio.update({
      where: { id: rascunho.id },
      data: { status: 'publicado', publicadoEm: new Date() },
    });
  }

  res.json({
    publicados,
    pendentes: totalPendentesRestantes,
    rascunhoFinalizado: totalPendentesRestantes === 0,
  });
});

async function proximaOrdemNaCategoriaReal(categoriaId: string): Promise<number> {
  const produtos = await prisma.produto.findMany({
    where: { categoriaId },
    select: { ordem: true },
  });
  return proximaOrdem(produtos);
}

rascunhoCardapioRouter.post('/descartar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const rascunho = await obterRascunhoAtivo(lojaId);
  if (!rascunho) return res.status(404).json({ erro: 'Nenhum rascunho ativo' });

  await prisma.rascunhoCardapio.update({
    where: { id: rascunho.id },
    data: { status: 'descartado' },
  });
  res.status(204).send();
});
