import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env';
import { requireAuth, requirePapel } from '../middleware/auth';
import { prisma } from '../prisma';
import { dataExpiracaoConvite, gerarTokenConvite } from '../utils/convite';
import { lojaElegivelParaExclusao } from '../utils/elegibilidadeExclusao';
import {
  CAMINHO_GUIA_INSTALAR,
  CAMINHO_GUIA_WHATSAPP,
  montarMensagemBoasVindas,
} from '../utils/mensagemBoasVindas';
import { montarOnboarding } from '../utils/onboarding';
import { calcularTrial, dataFimTrial } from '../utils/trial';

export const adminMasterRouter = Router();
adminMasterRouter.use(requireAuth, requirePapel('admin_master'));

function linkAtivacao(tokenBruto: string): string {
  return `${env.frontendUrl}/ativar-conta?token=${tokenBruto}`;
}

function linkAcesso(): string {
  return `${env.frontendUrl}/login`;
}

function linkCardapio(slug: string): string {
  return `${env.frontendUrl}/${slug}`;
}

function linkGuiaWhatsapp(): string {
  return `${env.frontendUrl}${CAMINHO_GUIA_WHATSAPP}`;
}

function linkGuiaInstalar(): string {
  return `${env.frontendUrl}${CAMINHO_GUIA_INSTALAR}`;
}

const JANELA_USO_RECENTE_MS = 7 * 24 * 60 * 60 * 1000;
const JANELA_TRIAL_VENCENDO_MS = 7 * 24 * 60 * 60 * 1000;

type LojaComRelacoes = Prisma.LojaGetPayload<{
  include: {
    _count: { select: { produtos: true; pedidos: true } };
    usuarios: { where: { papel: 'dono_loja' } };
  };
}>;

const includeLojaResumo = {
  _count: { select: { produtos: true, pedidos: true } },
  usuarios: { where: { papel: 'dono_loja' as const } },
} satisfies Prisma.LojaInclude;

function statusExibicao(loja: LojaComRelacoes): 'aguardando_ativacao' | 'ativa' | 'suspensa' {
  const dono = loja.usuarios[0];
  if (loja.status === 'suspensa') return 'suspensa';
  if (!dono?.senhaHash) return 'aguardando_ativacao';
  return 'ativa';
}

function serializarLojaResumo(loja: LojaComRelacoes, faturamento: number) {
  const dono = loja.usuarios[0] as (typeof loja.usuarios)[number] | undefined;
  return {
    id: loja.id,
    nome: loja.nome,
    slug: loja.slug,
    telefoneWhatsapp: loja.telefoneWhatsapp,
    status: statusExibicao(loja),
    criadoEm: loja.criadoEm,
    donoNome: dono?.nome ?? null,
    donoEmail: dono?.email ?? null,
    donoAtivado: dono?.senhaHash != null,
    ativadoEm: dono?.ativadoEm ?? null,
    ultimoAcessoEm: dono?.ultimoLoginEm ?? null,
    totalProdutos: loja._count.produtos,
    totalPedidos: loja._count.pedidos,
    valorMovimentado: faturamento,
    trial: calcularTrial(loja.trialInicioEm, loja.trialFimEm),
  };
}

// --- Visão geral ---

adminMasterRouter.get('/overview', async (_req, res) => {
  const agora = new Date();
  const seteDatrasAtrasEm = new Date(agora.getTime() - JANELA_USO_RECENTE_MS);
  const em7Dias = new Date(agora.getTime() + JANELA_TRIAL_VENCENDO_MS);

  const [
    totalLojas,
    lojasSuspensas,
    lojasAtivas,
    lojasAguardandoAtivacao,
    lojistasComUsoRecente,
    totalPedidos,
    faturamentoAgg,
    trialsVencendo,
    trialsExpirados,
  ] = await Promise.all([
    prisma.loja.count(),
    prisma.loja.count({ where: { status: 'suspensa' } }),
    prisma.loja.count({
      where: {
        status: 'ativa',
        usuarios: { some: { papel: 'dono_loja', senhaHash: { not: null } } },
      },
    }),
    prisma.loja.count({
      where: {
        status: { not: 'suspensa' },
        usuarios: { some: { papel: 'dono_loja', senhaHash: null } },
      },
    }),
    prisma.usuario.count({
      where: { papel: 'dono_loja', ultimoLoginEm: { gte: seteDatrasAtrasEm } },
    }),
    prisma.pedido.count(),
    prisma.pedido.aggregate({ _sum: { total: true } }),
    prisma.loja.count({
      where: { status: 'ativa', trialFimEm: { gt: agora, lte: em7Dias } },
    }),
    prisma.loja.count({
      where: { trialFimEm: { lte: agora, not: null } },
    }),
  ]);

  res.json({
    totalLojas,
    ativas: lojasAtivas,
    aguardandoAtivacao: lojasAguardandoAtivacao,
    suspensas: lojasSuspensas,
    lojistasComUsoRecente,
    totalPedidos,
    valorMovimentado: Number(faturamentoAgg._sum.total ?? 0),
    trialsVencendoEm7Dias: trialsVencendo,
    trialsExpirados,
  });
});

// --- Lista de lojas ---

const listaQuerySchema = z.object({
  busca: z.string().optional(),
  filtro: z.enum(['todas', 'ativas', 'aguardando', 'suspensas', 'sem_uso']).optional(),
});

adminMasterRouter.get('/lojas', async (req, res) => {
  const parsed = listaQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ erro: 'Parâmetros inválidos' });

  const where: Prisma.LojaWhereInput = {};
  if (parsed.data.busca) {
    where.nome = { contains: parsed.data.busca, mode: 'insensitive' };
  }
  if (parsed.data.filtro === 'suspensas') where.status = 'suspensa';

  const lojas = await prisma.loja.findMany({
    where,
    orderBy: { criadoEm: 'desc' },
    include: includeLojaResumo,
  });

  const faturamentos = await prisma.pedido.groupBy({
    by: ['lojaId'],
    _sum: { total: true },
    where: { lojaId: { in: lojas.map((l) => l.id) } },
  });
  const faturamentoPorLoja = new Map(
    faturamentos.map((f) => [f.lojaId, Number(f._sum.total ?? 0)]),
  );

  let resumos = lojas.map((loja) =>
    serializarLojaResumo(loja, faturamentoPorLoja.get(loja.id) ?? 0),
  );

  switch (parsed.data.filtro) {
    case 'ativas':
      resumos = resumos.filter((l) => l.status === 'ativa');
      break;
    case 'aguardando':
      resumos = resumos.filter((l) => l.status === 'aguardando_ativacao');
      break;
    case 'sem_uso':
      resumos = resumos.filter(
        (l) => l.status === 'ativa' && l.totalProdutos === 0 && l.totalPedidos === 0,
      );
      break;
    default:
      break;
  }

  res.json(resumos);
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

  const linkAtiv = linkAtivacao(tokenBruto);
  res.status(201).json({
    id: loja.id,
    nome: loja.nome,
    slug: loja.slug,
    telefoneWhatsapp: loja.telefoneWhatsapp,
    status: 'aguardando_ativacao',
    criadoEm: loja.criadoEm,
    donoNome: parsed.data.donoNome,
    donoEmail: parsed.data.donoEmail,
    donoAtivado: false,
    ativadoEm: null,
    ultimoAcessoEm: null,
    totalProdutos: 0,
    totalPedidos: 0,
    valorMovimentado: 0,
    trial: calcularTrial(null, null),
    linkAtivacao: linkAtiv,
    linkAcesso: linkAcesso(),
    linkCardapio: linkCardapio(loja.slug),
    linkGuiaWhatsapp: linkGuiaWhatsapp(),
    linkGuiaInstalar: linkGuiaInstalar(),
    mensagemBoasVindas: montarMensagemBoasVindas({
      donoNome: parsed.data.donoNome,
      lojaNome: loja.nome,
      linkAtivacao: linkAtiv,
      linkAcesso: linkAcesso(),
      linkCardapio: linkCardapio(loja.slug),
      linkGuiaWhatsapp: linkGuiaWhatsapp(),
      linkGuiaInstalar: linkGuiaInstalar(),
    }),
  });
});

// Gera um novo link de ativação pro dono da loja — só faz sentido enquanto a
// conta ainda está aguardando ativação (primeiro convite perdido/expirado).
// NUNCA deve ser usado como mecanismo de recuperação de senha de uma loja já
// ativa — ver missão "Corrigir ação de ativação". Qualquer convite anterior
// ainda pendente é revogado.
adminMasterRouter.post('/lojas/:id/convite', async (req, res) => {
  const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const dono = await prisma.usuario.findFirst({
    where: { lojaId: loja.id, papel: 'dono_loja' },
  });
  if (!dono) {
    return res.status(404).json({ erro: 'Nenhum usuário dono encontrado para esta loja' });
  }
  if (dono.senhaHash != null) {
    return res.status(400).json({
      erro: 'Esta loja já está ativa. Convite de ativação não pode ser usado para redefinir senha.',
    });
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

  const linkAtiv = linkAtivacao(tokenBruto);
  res.status(201).json({
    linkAtivacao: linkAtiv,
    linkAcesso: linkAcesso(),
    linkCardapio: linkCardapio(loja.slug),
    linkGuiaWhatsapp: linkGuiaWhatsapp(),
    linkGuiaInstalar: linkGuiaInstalar(),
    mensagemBoasVindas: montarMensagemBoasVindas({
      donoNome: dono.nome,
      lojaNome: loja.nome,
      linkAtivacao: linkAtiv,
      linkAcesso: linkAcesso(),
      linkCardapio: linkCardapio(loja.slug),
      linkGuiaWhatsapp: linkGuiaWhatsapp(),
      linkGuiaInstalar: linkGuiaInstalar(),
    }),
  });
});

// --- Detalhe da loja ---

adminMasterRouter.get('/lojas/:id', async (req, res) => {
  const loja = await prisma.loja.findUnique({
    where: { id: req.params.id },
    include: includeLojaResumo,
  });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const faturamentoAgg = await prisma.pedido.aggregate({
    where: { lojaId: loja.id },
    _sum: { total: true },
  });
  const dono = loja.usuarios[0] as (typeof loja.usuarios)[number] | undefined;

  res.json({
    ...serializarLojaResumo(loja, Number(faturamentoAgg._sum.total ?? 0)),
    endereco: loja.endereco,
    suspensaEm: loja.suspensaEm,
    onboarding: montarOnboarding({
      contaAtivada: dono?.senhaHash != null,
      primeiroAcesso: dono?.ultimoLoginEm != null,
      totalProdutos: loja._count.produtos,
      totalPedidos: loja._count.pedidos,
    }),
  });
});

const editarLojaSchema = z.object({
  nome: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen')
    .optional(),
  telefoneWhatsapp: z.string().min(8).optional(),
  donoNome: z.string().min(1).optional(),
  donoEmail: z.string().email().optional(),
});

adminMasterRouter.put('/lojas/:id', async (req, res) => {
  const parsed = editarLojaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  if (parsed.data.slug && parsed.data.slug !== loja.slug) {
    const slugEmUso = await prisma.loja.findUnique({ where: { slug: parsed.data.slug } });
    if (slugEmUso) return res.status(400).json({ erro: 'Esse link (slug) já está em uso' });
  }

  const dono = await prisma.usuario.findFirst({ where: { lojaId: loja.id, papel: 'dono_loja' } });

  if (parsed.data.donoEmail && dono && parsed.data.donoEmail !== dono.email) {
    const emailEmUso = await prisma.usuario.findUnique({ where: { email: parsed.data.donoEmail } });
    if (emailEmUso) return res.status(400).json({ erro: 'Esse e-mail já está em uso' });
  }

  const { nome, slug, telefoneWhatsapp, donoNome, donoEmail } = parsed.data;

  await prisma.$transaction([
    prisma.loja.update({
      where: { id: loja.id },
      data: { nome, slug, telefoneWhatsapp },
    }),
    ...(dono && (donoNome !== undefined || donoEmail !== undefined)
      ? [
          prisma.usuario.update({
            where: { id: dono.id },
            data: { nome: donoNome, email: donoEmail },
          }),
        ]
      : []),
  ]);

  const atualizada = await prisma.loja.findUnique({
    where: { id: loja.id },
    include: includeLojaResumo,
  });
  if (!atualizada) return res.status(404).json({ erro: 'Loja não encontrada' });
  const faturamentoAgg = await prisma.pedido.aggregate({
    where: { lojaId: loja.id },
    _sum: { total: true },
  });
  res.json(serializarLojaResumo(atualizada, Number(faturamentoAgg._sum.total ?? 0)));
});

// --- Suspender / reativar ---

const statusSchema = z.object({ status: z.enum(['ativa', 'suspensa']) });

adminMasterRouter.patch('/lojas/:id/status', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Status inválido' });

  const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const loja2 = await prisma.loja.update({
    where: { id: loja.id },
    data: {
      status: parsed.data.status,
      suspensaEm: parsed.data.status === 'suspensa' ? new Date() : null,
    },
  });
  res.json({ id: loja2.id, status: loja2.status, suspensaEm: loja2.suspensaEm });
});

// --- Excluir ---

adminMasterRouter.delete('/lojas/:id', async (req, res) => {
  const loja = await prisma.loja.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { produtos: true, pedidos: true } } },
  });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const elegivel = lojaElegivelParaExclusao({
    totalProdutos: loja._count.produtos,
    totalPedidos: loja._count.pedidos,
  });
  if (!elegivel) {
    return res.status(409).json({
      erro: 'Esta loja já tem operação registrada (produtos e/ou pedidos) e não pode ser excluída — suspenda a loja para preservar o histórico.',
    });
  }

  await prisma.loja.delete({ where: { id: loja.id } });
  res.status(204).send();
});

// --- Trial ---

// Lojas ativadas antes do trial existir (ou qualquer loja com trialInicioEm
// nulo) não ganham data retroativa por migration — só o Admin Master pode
// iniciar o trial manualmente, uma única vez, e só depois que o dono já
// ativou a própria conta (senão o trial "começaria" antes de existir usuário
// pra usá-lo).
adminMasterRouter.post('/lojas/:id/trial/iniciar', async (req, res) => {
  const loja = await prisma.loja.findUnique({
    where: { id: req.params.id },
    include: { usuarios: { where: { papel: 'dono_loja' } } },
  });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const dono = loja.usuarios[0] as (typeof loja.usuarios)[number] | undefined;
  if (dono?.senhaHash == null) {
    return res.status(400).json({
      erro: 'A loja ainda não foi ativada pelo dono — o trial só pode ser iniciado após a ativação.',
    });
  }
  if (loja.trialInicioEm != null) {
    return res.status(400).json({ erro: 'Esta loja já possui um trial iniciado.' });
  }

  const agora = new Date();
  const atualizada = await prisma.loja.update({
    where: { id: loja.id },
    data: { trialInicioEm: agora, trialFimEm: dataFimTrial(agora) },
  });

  res.json({
    id: atualizada.id,
    trial: calcularTrial(atualizada.trialInicioEm, atualizada.trialFimEm),
  });
});

const prorrogarTrialSchema = z.object({
  dias: z.union([z.literal(7), z.literal(15), z.literal(30)]),
});

adminMasterRouter.post('/lojas/:id/trial/prorrogar', async (req, res) => {
  const parsed = prorrogarTrialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Quantidade de dias inválida' });

  const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });
  if (!loja.trialFimEm) {
    return res.status(400).json({
      erro: 'Esta loja ainda não iniciou o trial — o dono precisa ativar a conta primeiro.',
    });
  }

  const novoFim = new Date(loja.trialFimEm.getTime() + parsed.data.dias * 24 * 60 * 60 * 1000);
  const atualizada = await prisma.loja.update({
    where: { id: loja.id },
    data: { trialFimEm: novoFim },
  });

  res.json({
    id: atualizada.id,
    trial: calcularTrial(atualizada.trialInicioEm, atualizada.trialFimEm),
  });
});
