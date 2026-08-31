import { Router } from 'express';
import { z } from 'zod';
import { lojaIdDoUsuario, requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';
import { proximaOrdem } from '../utils/ordenacao';
import {
  segmentoValido,
  SEGMENTOS_LOJA,
  sugerirCategoriasPorSegmento,
} from '../utils/segmentoLoja';

export const onboardingRouter = Router();
onboardingRouter.use(requireAuth);

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

/** Toda loja passa a ter uma linha (backfill pra antigas, criação direta pra novas) — mas nunca assume isso, sempre cria sob demanda se faltar. */
async function obterOuCriarOnboarding(lojaId: string) {
  const existente = await prisma.onboardingLoja.findUnique({ where: { lojaId } });
  if (existente) return existente;
  return prisma.onboardingLoja.create({ data: { lojaId } });
}

onboardingRouter.get('/', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const onboarding = await obterOuCriarOnboarding(lojaId);
  res.json({ ...onboarding, segmentos: SEGMENTOS_LOJA });
});

const atualizarOnboardingSchema = z.object({
  segmentoNegocio: z.string().refine(segmentoValido, 'Segmento inválido').optional(),
  etapaAtual: z.string().min(1).optional(),
  etapaConcluida: z.string().min(1).optional(),
  metodoCardapio: z.enum(['planilha', 'colar_texto', 'arquivo', 'guiado', 'manual']).optional(),
});

onboardingRouter.put('/', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = atualizarOnboardingSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const atual = await obterOuCriarOnboarding(lojaId);

  const etapasConcluidas = new Set((atual.etapasConcluidas as string[] | null) ?? []);
  if (parsed.data.etapaConcluida) etapasConcluidas.add(parsed.data.etapaConcluida);

  const onboarding = await prisma.onboardingLoja.update({
    where: { lojaId },
    data: {
      status: atual.status === 'nao_iniciado' ? 'em_andamento' : undefined,
      iniciadoEm: atual.iniciadoEm ?? new Date(),
      segmentoNegocio: parsed.data.segmentoNegocio ?? undefined,
      etapaAtual: parsed.data.etapaAtual ?? undefined,
      metodoCardapio: parsed.data.metodoCardapio ?? undefined,
      etapasConcluidas: [...etapasConcluidas],
    },
  });
  res.json(onboarding);
});

onboardingRouter.post('/concluir', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  await obterOuCriarOnboarding(lojaId);
  const onboarding = await prisma.onboardingLoja.update({
    where: { lojaId },
    data: { status: 'concluido', concluidoEm: new Date() },
  });
  res.json(onboarding);
});

onboardingRouter.get('/sugestoes-categorias', async (req, res) => {
  const parsed = z.object({ segmento: z.string() }).safeParse(req.query);
  if (!parsed.success || !segmentoValido(parsed.data.segmento)) {
    return res.status(400).json({ erro: 'Segmento inválido' });
  }
  res.json({ categorias: sugerirCategoriasPorSegmento(parsed.data.segmento) });
});

const categoriasGuiadasSchema = z.object({
  nomes: z.array(z.string().trim().min(1)).min(1).max(30),
});

// "Montar com ajuda do SmartFood" — nunca inventa produto/preço, só cria as
// categorias que o lojista escolheu/editou a partir da sugestão; depois o
// fluxo manda ele pro cadastro normal de produtos (PainelProdutos).
onboardingRouter.post('/categorias-guiadas', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = categoriasGuiadasSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const existentes = await prisma.categoria.findMany({
    where: { lojaId },
    select: { ordem: true },
  });
  let proxima = proximaOrdem(existentes);

  const categorias = await prisma.$transaction(
    parsed.data.nomes.map((nome) =>
      prisma.categoria.create({ data: { lojaId, nome, ordem: proxima++ } }),
    ),
  );
  res.status(201).json(categorias);
});
