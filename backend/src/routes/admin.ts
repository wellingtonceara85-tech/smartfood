import {
  BairroEntrega,
  FaixaEntregaDistancia,
  GrupoOpcoes,
  OpcaoGrupo,
  Pedido,
  Prisma,
  Produto,
} from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { lojaIdDoUsuario, requireAuth, requirePapel } from '../middleware/auth';
import { prisma } from '../prisma';
import { HEX_REGEX, normalizarCor } from '../utils/cor';
import { latitudeValida, longitudeValida, validarFaixasEntrega } from '../utils/distancia';
import {
  calcularAberto,
  HorariosFuncionamento,
  validarHorariosFuncionamento,
} from '../utils/horario';
import { grupoParaCriarSemProdutoId, gruposParaCriarSemProdutoId } from '../utils/gruposOpcoes';
import { modelosGruposParaSegmento } from '../utils/modelosGrupoOpcoes';
import { calcularNovaOrdem, proximaOrdem } from '../utils/ordenacao';
import { montarPendenciasLoja } from '../utils/pendenciasLoja';
import { MENSAGEM_ERRO_CHAVE_PIX, validarChavePix } from '../utils/pixPayload';
import { calcularProgressoLoja } from '../utils/progressoLoja';
import { cancelamentoPermitido, STATUS_PEDIDO, transicaoValida } from '../utils/statusPedido';
import { calcularTrial } from '../utils/trial';

const corHexSchema = z
  .string()
  .regex(HEX_REGEX, 'Cor inválida — use o formato #RRGGBB')
  .transform(normalizarCor);

function serializarProduto(produto: Produto & { _count?: { gruposOpcoes: number } }) {
  return { ...produto, preco: Number(produto.preco) };
}

function serializarGrupoOpcoes(grupo: GrupoOpcoes & { opcoes: OpcaoGrupo[] }) {
  return {
    ...grupo,
    opcoes: grupo.opcoes.map((opcao) => ({
      ...opcao,
      precoAdicional: Number(opcao.precoAdicional),
    })),
  };
}

function serializarBairro(bairro: BairroEntrega) {
  return { ...bairro, valorEntrega: Number(bairro.valorEntrega) };
}

function serializarFaixaEntrega(faixa: FaixaEntregaDistancia) {
  return { ...faixa, valorEntrega: Number(faixa.valorEntrega) };
}

function serializarPedido(pedido: Pedido) {
  return {
    ...pedido,
    total: Number(pedido.total),
    valorEntrega: Number(pedido.valorEntrega),
    trocoPara: pedido.trocoPara === null ? null : Number(pedido.trocoPara),
  };
}

/** O Prisma tipa a coluna Json genericamente — o formato real é sempre o validado em validarHorariosFuncionamento antes de gravar. */
function comAberto<
  T extends {
    horarioAbertura: string | null;
    horarioFechamento: string | null;
    abertoManual: boolean | null;
    horariosFuncionamento: Prisma.JsonValue | null;
  },
>(loja: T): T & { aberto: boolean } {
  return {
    ...loja,
    aberto: calcularAberto({
      ...loja,
      horariosFuncionamento: loja.horariosFuncionamento as HorariosFuncionamento | null,
    }),
  };
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

function usuarioIdOuErro(
  req: import('express').Request,
  res: import('express').Response,
): string | null {
  const usuarioId = req.user?.sub;
  if (!usuarioId) {
    res.status(401).json({ erro: 'Não autenticado' });
    return null;
  }
  return usuarioId;
}

// --- Loja ---

adminRouter.get('/loja', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });
  res.json({
    ...comAberto(loja),
    trial: calcularTrial(loja.trialInicioEm, loja.trialFimEm),
  });
});

const faixaHorarioDiaSchema = z.object({
  abertura: z.string(),
  fechamento: z.string(),
});

const diaHorarioFuncionamentoSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  ativo: z.boolean(),
  faixas: z.array(faixaHorarioDiaSchema).max(6),
});

const horariosFuncionamentoSchema = z.array(diaHorarioFuncionamentoSchema).nullable().optional();

const coordenadaSchema = z
  .number()
  .nullable()
  .optional()
  .refine((valor) => valor === null || valor === undefined || Number.isFinite(valor), {
    message: 'Coordenada inválida',
  });

const atualizarLojaSchema = z
  .object({
    nome: z.string().min(1).optional(),
    tagline: z.string().nullable().optional(),
    logoUrl: z.string().url().nullable().optional(),
    capaUrl: z.string().url().nullable().optional(),
    endereco: z.string().nullable().optional(),
    chavePix: z.string().nullable().optional(),
    pixTipoChave: z.enum(['cpf', 'cnpj', 'telefone', 'email', 'aleatoria']).nullable().optional(),
    pixTitular: z.string().nullable().optional(),
    pixCidade: z.string().nullable().optional(),
    telefoneWhatsapp: z.string().min(8).optional(),
    horarioAbertura: z.string().nullable().optional(),
    horarioFechamento: z.string().nullable().optional(),
    abertoManual: z.boolean().nullable().optional(),
    horariosFuncionamento: horariosFuncionamentoSchema,
    corPrimaria: corHexSchema.optional(),
    corSecundaria: corHexSchema.optional(),
    aceitaAgendamento: z.boolean().optional(),
    antecedenciaMinimaMinutos: z.number().int().nonnegative().optional(),
    latitude: coordenadaSchema,
    longitude: coordenadaSchema,
    calcularEntregaPorDistancia: z.boolean().optional(),
  })
  .refine(
    (dados) =>
      dados.latitude === null || dados.latitude === undefined || latitudeValida(dados.latitude),
    { message: 'Latitude inválida', path: ['latitude'] },
  )
  .refine(
    (dados) =>
      dados.longitude === null || dados.longitude === undefined || longitudeValida(dados.longitude),
    { message: 'Longitude inválida', path: ['longitude'] },
  );

adminRouter.put('/loja', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = atualizarLojaSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  if (parsed.data.horariosFuncionamento) {
    const validacaoHorarios = validarHorariosFuncionamento(parsed.data.horariosFuncionamento);
    if (!validacaoHorarios.valido) {
      return res.status(400).json({ erro: validacaoHorarios.erro });
    }
  }

  // Só valida a chave quando um tipo é informado — loja antiga que só tem
  // `chavePix` (modo simples, sem tipo/titular/cidade) nunca passa por aqui,
  // então nunca é bloqueada por editar qualquer outro dado da loja (ver
  // relatório da missão). Quando o tipo vem no body mas a chave não (não
  // acontece no formulário atual, que sempre manda os dois juntos, mas fica
  // defensivo pra qualquer outro chamador), usa a chave já salva.
  if (parsed.data.pixTipoChave) {
    const chaveParaValidar =
      parsed.data.chavePix !== undefined
        ? parsed.data.chavePix
        : (await prisma.loja.findUnique({ where: { id: lojaId }, select: { chavePix: true } }))
            ?.chavePix;
    if (!chaveParaValidar || !validarChavePix(parsed.data.pixTipoChave, chaveParaValidar)) {
      return res.status(400).json({
        erro: MENSAGEM_ERRO_CHAVE_PIX[parsed.data.pixTipoChave],
        campo: 'pix',
      });
    }
  }

  // Não dá pra ligar o cálculo por distância sem uma origem — evita o estado
  // impossível de "ligado mas sem latitude/longitude" em vez de deixar pra
  // barrar isso só na hora de calcular o pedido.
  if (parsed.data.calcularEntregaPorDistancia) {
    const atual = await prisma.loja.findUnique({
      where: { id: lojaId },
      select: { latitude: true, longitude: true },
    });
    const latitude = parsed.data.latitude !== undefined ? parsed.data.latitude : atual?.latitude;
    const longitude =
      parsed.data.longitude !== undefined ? parsed.data.longitude : atual?.longitude;
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return res.status(400).json({
        erro: 'Configure a localização da loja antes de ativar o cálculo por distância.',
      });
    }
  }

  const loja = await prisma.loja.update({
    where: { id: lojaId },
    data: parsed.data as Prisma.LojaUpdateInput,
  });
  res.json(comAberto(loja));
});

// Pendências de configuração da loja pro card "Deixe sua loja pronta para
// vender mais" no dashboard do lojista — calculadas em cima do estado real
// (sem checklist manual/flag persistida), por isso não depende do filtro de
// período do dashboard e vive num endpoint próprio.
adminRouter.get('/pendencias', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const [loja, produtos] = await Promise.all([
    prisma.loja.findUnique({
      where: { id: lojaId },
      select: {
        horarioAbertura: true,
        horarioFechamento: true,
        abertoManual: true,
        horariosFuncionamento: true,
        logoUrl: true,
        endereco: true,
      },
    }),
    prisma.produto.findMany({
      where: { lojaId },
      select: { fotoUrl: true, descricao: true },
    }),
  ]);
  if (!loja) return res.status(404).json({ erro: 'Loja não encontrada' });

  const pendencias = montarPendenciasLoja({ ...loja, produtos });
  res.json({ pendencias, progresso: calcularProgressoLoja(pendencias.length) });
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

const reordenarCategoriasSchema = z.object({
  ids: z.array(z.string().uuid()),
});

// Registrado ANTES de "/categorias/:id" de propósito — o Express casa rotas
// na ordem de registro, e ":id" bateria com o literal "reordenar" primeiro
// se viesse depois.
adminRouter.put('/categorias/reordenar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = reordenarCategoriasSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const categorias = await prisma.categoria.findMany({ where: { lojaId }, select: { id: true } });
  const resultado = calcularNovaOrdem(
    categorias.map((c) => c.id),
    parsed.data.ids,
  );
  if (!resultado.valida) return res.status(400).json({ erro: resultado.erro });

  await prisma.$transaction(
    [...resultado.ordemPorId!.entries()].map(([id, ordem]) =>
      prisma.categoria.update({ where: { id }, data: { ordem } }),
    ),
  );

  const atualizadas = await prisma.categoria.findMany({
    where: { lojaId },
    orderBy: { ordem: 'asc' },
  });
  res.json(atualizadas);
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
    orderBy: [{ categoriaId: 'asc' }, { ordem: 'asc' }],
    include: { _count: { select: { gruposOpcoes: true } } },
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

// Definidos aqui (e não junto da seção "Grupos de opções" mais abaixo, onde
// moram conceitualmente) porque produtoComGruposSchema — usado só por POST
// /produtos — precisa deles antes de ser declarado.
const opcaoGrupoSchema = z.object({
  nome: z.string().min(1),
  precoAdicional: z.number().nonnegative().default(0),
  ativo: z.boolean().optional().default(true),
  ordem: z.number().int().optional(),
});

const grupoOpcoesSchema = z
  .object({
    nome: z.string().min(1),
    minEscolhas: z.number().int().min(0).default(0),
    maxEscolhas: z.number().int().min(1).default(1),
    obrigatorio: z.boolean().optional().default(false),
    ativo: z.boolean().optional().default(true),
    ordem: z.number().int().optional(),
    opcoes: z.array(opcaoGrupoSchema).default([]),
  })
  .refine((grupo) => grupo.maxEscolhas >= grupo.minEscolhas, {
    message: 'A escolha máxima precisa ser maior ou igual à escolha mínima',
    path: ['maxEscolhas'],
  });

// Só para criação: permite o lojista já configurar grupos de opções durante
// o cadastro do produto (ver Missão "Grupos de opções — UX de criação"),
// sem precisar salvar o produto, sair e editar de novo. Deliberadamente
// separado de produtoSchema — PUT /produtos/:id continua sem saber nada de
// `grupos` (edição de grupos de produto já existente segue exclusivamente
// pelos endpoints /produtos/:id/grupos-opcoes, sem mudança de comportamento).
const produtoComGruposSchema = produtoSchema.extend({
  grupos: z.array(grupoOpcoesSchema).optional().default([]),
});

adminRouter.post('/produtos', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = produtoComGruposSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const categoria = await prisma.categoria.findFirst({
    where: { id: parsed.data.categoriaId, lojaId },
  });
  if (!categoria) return res.status(400).json({ erro: 'Categoria inválida para esta loja' });

  const produtosDaCategoria = await prisma.produto.findMany({
    where: { categoriaId: parsed.data.categoriaId },
    select: { ordem: true },
  });

  const { grupos, ...dadosProduto } = parsed.data;

  const produto = await prisma.produto.create({
    data: {
      lojaId,
      categoriaId: dadosProduto.categoriaId,
      nome: dadosProduto.nome,
      descricao: dadosProduto.descricao ?? null,
      preco: dadosProduto.preco,
      fotoUrl: dadosProduto.fotoUrl ?? null,
      disponivel: dadosProduto.disponivel ?? true,
      opcoes: dadosProduto.opcoes ?? Prisma.JsonNull,
      ordem: proximaOrdem(produtosDaCategoria),
      // Numa escrita só (transação implícita do Prisma pra nested writes) —
      // nunca existe um produto "criado mas sem os grupos que o lojista
      // configurou" por causa de uma falha no meio do caminho.
      ...(grupos.length > 0
        ? { gruposOpcoes: { create: gruposParaCriarSemProdutoId(grupos) } }
        : {}),
    },
    include: { _count: { select: { gruposOpcoes: true } } },
  });
  res.status(201).json(serializarProduto(produto));
});

const reordenarProdutosSchema = z.object({
  categoriaId: z.string().uuid(),
  ids: z.array(z.string().uuid()),
});

// Registradas ANTES de "/produtos/:id" pelo mesmo motivo das categorias —
// evita que ":id" capture o literal "reordenar"/"mover" primeiro.
adminRouter.put('/produtos/reordenar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = reordenarProdutosSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const categoria = await prisma.categoria.findFirst({
    where: { id: parsed.data.categoriaId, lojaId },
  });
  if (!categoria) return res.status(400).json({ erro: 'Categoria inválida para esta loja' });

  const produtos = await prisma.produto.findMany({
    where: { categoriaId: parsed.data.categoriaId, lojaId },
    select: { id: true },
  });
  const resultado = calcularNovaOrdem(
    produtos.map((p) => p.id),
    parsed.data.ids,
  );
  if (!resultado.valida) return res.status(400).json({ erro: resultado.erro });

  await prisma.$transaction(
    [...resultado.ordemPorId!.entries()].map(([id, ordem]) =>
      prisma.produto.update({ where: { id }, data: { ordem } }),
    ),
  );

  const atualizados = await prisma.produto.findMany({
    where: { categoriaId: parsed.data.categoriaId, lojaId },
    orderBy: { ordem: 'asc' },
  });
  res.json(atualizados.map(serializarProduto));
});

const moverProdutosSchema = z.object({
  produtoIds: z.array(z.string().uuid()).min(1),
  categoriaId: z.string().uuid(),
});

/** Mover em massa pro fim da categoria de destino — nunca mistura com a ordem que os produtos já tinham na categoria de origem. */
adminRouter.post('/produtos/mover', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = moverProdutosSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const categoriaDestino = await prisma.categoria.findFirst({
    where: { id: parsed.data.categoriaId, lojaId },
  });
  if (!categoriaDestino) return res.status(400).json({ erro: 'Categoria inválida para esta loja' });

  const produtosSelecionados = await prisma.produto.findMany({
    where: { id: { in: parsed.data.produtoIds }, lojaId },
  });
  if (produtosSelecionados.length !== parsed.data.produtoIds.length) {
    return res
      .status(400)
      .json({ erro: 'Um ou mais produtos selecionados não pertencem a esta loja' });
  }

  const produtosNoDestino = await prisma.produto.findMany({
    where: { categoriaId: parsed.data.categoriaId },
    select: { ordem: true },
  });
  const ordemInicial = proximaOrdem(produtosNoDestino);

  await prisma.$transaction(
    produtosSelecionados.map((produto, indice) =>
      prisma.produto.update({
        where: { id: produto.id },
        data: { categoriaId: parsed.data.categoriaId, ordem: ordemInicial + indice },
      }),
    ),
  );

  const atualizados = await prisma.produto.findMany({
    where: { id: { in: parsed.data.produtoIds } },
  });
  res.json(atualizados.map(serializarProduto));
});

adminRouter.post('/produtos/:id/duplicar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const original = await prisma.produto.findFirst({
    where: { id: req.params.id, lojaId },
    include: { gruposOpcoes: { orderBy: { ordem: 'asc' }, include: { opcoes: true } } },
  });
  if (!original) return res.status(404).json({ erro: 'Produto não encontrado' });

  const produtosDaCategoria = await prisma.produto.findMany({
    where: { categoriaId: original.categoriaId },
    select: { ordem: true },
  });

  // Copia a URL da foto direto (mesmo arquivo no Storage) — sem re-upload,
  // o produto novo só passa a apontar pra referência que já existe. Grupos e
  // opções também são copiados por valor (nunca vinculados ao produto
  // original): editar a cópia depois nunca afeta o produto original.
  const copia = await prisma.produto.create({
    data: {
      lojaId,
      categoriaId: original.categoriaId,
      nome: `${original.nome} (cópia)`,
      descricao: original.descricao,
      preco: original.preco,
      fotoUrl: original.fotoUrl,
      disponivel: original.disponivel,
      opcoes: original.opcoes ?? Prisma.JsonNull,
      ordem: proximaOrdem(produtosDaCategoria),
      gruposOpcoes: {
        create: original.gruposOpcoes.map((grupo) => ({
          nome: grupo.nome,
          minEscolhas: grupo.minEscolhas,
          maxEscolhas: grupo.maxEscolhas,
          obrigatorio: grupo.obrigatorio,
          ativo: grupo.ativo,
          ordem: grupo.ordem,
          opcoes: {
            create: grupo.opcoes.map((opcao) => ({
              nome: opcao.nome,
              precoAdicional: opcao.precoAdicional,
              ativo: opcao.ativo,
              ordem: opcao.ordem,
            })),
          },
        })),
      },
    },
  });
  res.status(201).json(serializarProduto(copia));
});

// `grupos` opcional e SEM default de propósito (diferente de produtoComGruposSchema):
// omitido = não mexe nos grupos já salvos; presente (mesmo `[]`) = substitui a
// árvore inteira. Ver "Grupos de opções" mais abaixo pro mesmo padrão de
// substituição total usado por PUT /produtos/:id/grupos-opcoes.
const produtoAtualizacaoSchema = produtoSchema.partial().extend({
  grupos: z.array(grupoOpcoesSchema).optional(),
});

adminRouter.put('/produtos/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = produtoAtualizacaoSchema.safeParse(req.body);
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

  const { opcoes, grupos, ...resto } = parsed.data;

  // Produto e grupos são atualizados na mesma transação — um lojista que
  // edita nome/preço e grupos de opções ao mesmo tempo (ex: pelo botão
  // "Salvar" principal da tela de edição, que manda tudo junto) nunca corre
  // o risco de salvar uma metade e perder a outra silenciosamente. Isso
  // também é o que corrige o bug relatado: antes, só POST /produtos aceitava
  // `grupos` — o "Salvar" da edição nunca enviava as mudanças feitas nos
  // grupos, então reabrir o produto sempre mostrava os valores antigos.
  await prisma.$transaction([
    prisma.produto.update({
      where: { id: existente.id },
      data: {
        ...resto,
        ...(opcoes !== undefined ? { opcoes: opcoes ?? Prisma.JsonNull } : {}),
      },
    }),
    ...(grupos !== undefined
      ? [
          prisma.grupoOpcoes.deleteMany({ where: { produtoId: existente.id } }),
          ...grupos.map((grupo, indiceGrupo) =>
            prisma.grupoOpcoes.create({
              data: { produtoId: existente.id, ...grupoParaCriarSemProdutoId(grupo, indiceGrupo) },
            }),
          ),
        ]
      : []),
  ]);

  const produto = await prisma.produto.findUniqueOrThrow({
    where: { id: existente.id },
    include: { _count: { select: { gruposOpcoes: true } } },
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

// --- Grupos de opções ---
//
// Cada grupo pertence a um único produto (nunca compartilhado por
// referência) — "reutilizar em outro produto" é sempre uma cópia explícita
// (ver /copiar abaixo), no mesmo espírito de "Duplicar produto".
//
// opcaoGrupoSchema/grupoOpcoesSchema ficam definidos lá em cima (antes de
// produtoSchema) porque POST /produtos também os usa, pra criar produto +
// grupos numa única escrita atômica quando o lojista já configura grupos
// durante o cadastro — ver produtoComGruposSchema.

const salvarGruposOpcoesSchema = z.object({
  grupos: z.array(grupoOpcoesSchema),
});

adminRouter.get('/produtos/:produtoId/grupos-opcoes', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const produto = await prisma.produto.findFirst({
    where: { id: req.params.produtoId, lojaId },
  });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const grupos = await prisma.grupoOpcoes.findMany({
    where: { produtoId: produto.id },
    orderBy: { ordem: 'asc' },
    include: { opcoes: { orderBy: { ordem: 'asc' } } },
  });
  res.json(grupos.map(serializarGrupoOpcoes));
});

// Substitui a árvore inteira de grupos+opções do produto de uma vez (apaga e
// recria) — mais simples que fazer diff campo a campo, e seguro porque nada
// fora daqui referencia o id de um GrupoOpcoes/OpcaoGrupo específico: um
// pedido já feito guarda uma cópia (nome + preço) do que foi escolhido, nunca
// o id (ver utils/gruposOpcoes.ts), então apagar e recriar nunca invalida um
// pedido existente.
adminRouter.put('/produtos/:produtoId/grupos-opcoes', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const produto = await prisma.produto.findFirst({
    where: { id: req.params.produtoId, lojaId },
  });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const parsed = salvarGruposOpcoesSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  await prisma.$transaction([
    prisma.grupoOpcoes.deleteMany({ where: { produtoId: produto.id } }),
    ...parsed.data.grupos.map((grupo, indice) =>
      prisma.grupoOpcoes.create({
        data: { produtoId: produto.id, ...grupoParaCriarSemProdutoId(grupo, indice) },
      }),
    ),
  ]);

  const grupos = await prisma.grupoOpcoes.findMany({
    where: { produtoId: produto.id },
    orderBy: { ordem: 'asc' },
    include: { opcoes: { orderBy: { ordem: 'asc' } } },
  });
  res.json(grupos.map(serializarGrupoOpcoes));
});

const copiarGrupoSchema = z.object({
  produtoDestinoId: z.string().uuid(),
});

// Copia um grupo (com as opções dele) pra outro produto da mesma loja — evita
// o lojista recadastrar "Proteínas"/"Acompanhamentos" do zero em cada
// produto. Sempre uma cópia independente: editar depois num dos dois lados
// nunca afeta o outro.
adminRouter.post('/produtos/:produtoId/grupos-opcoes/:grupoId/copiar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = copiarGrupoSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const grupoOrigem = await prisma.grupoOpcoes.findFirst({
    where: { id: req.params.grupoId, produtoId: req.params.produtoId, produto: { lojaId } },
    include: { opcoes: true },
  });
  if (!grupoOrigem) return res.status(404).json({ erro: 'Grupo não encontrado' });

  const produtoDestino = await prisma.produto.findFirst({
    where: { id: parsed.data.produtoDestinoId, lojaId },
  });
  if (!produtoDestino)
    return res.status(400).json({ erro: 'Produto de destino inválido para esta loja' });

  const gruposDestino = await prisma.grupoOpcoes.findMany({
    where: { produtoId: produtoDestino.id },
    select: { ordem: true },
  });

  const copia = await prisma.grupoOpcoes.create({
    data: {
      produtoId: produtoDestino.id,
      nome: grupoOrigem.nome,
      minEscolhas: grupoOrigem.minEscolhas,
      maxEscolhas: grupoOrigem.maxEscolhas,
      obrigatorio: grupoOrigem.obrigatorio,
      ativo: grupoOrigem.ativo,
      ordem: proximaOrdem(gruposDestino),
      opcoes: {
        create: grupoOrigem.opcoes.map((opcao) => ({
          nome: opcao.nome,
          precoAdicional: opcao.precoAdicional,
          ativo: opcao.ativo,
          ordem: opcao.ordem,
        })),
      },
    },
    include: { opcoes: { orderBy: { ordem: 'asc' } } },
  });
  res.status(201).json(serializarGrupoOpcoes(copia));
});

// Sugestões de grupos por segmento da loja (mesmo padrão de
// sugerirCategoriasPorSegmento) — o lojista aplica com um clique, edita ou
// ignora; nada aqui grava nada sozinho no banco.
adminRouter.get('/modelos-grupos-opcoes', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const onboarding = await prisma.onboardingLoja.findUnique({
    where: { lojaId },
    select: { segmentoNegocio: true },
  });
  const modelos = onboarding?.segmentoNegocio
    ? modelosGruposParaSegmento(onboarding.segmentoNegocio)
    : [];
  res.json({ segmento: onboarding?.segmentoNegocio ?? null, modelos });
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

// --- Faixas de entrega por distância ---
//
// Estratégia alternativa à de bairro, opt-in via loja.calcularEntregaPorDistancia.
// Cada loja define as próprias faixas livremente (nenhum limite/valor é fixo
// no código) — CRUD item a item, no mesmo padrão de /bairros (criar, editar,
// ativar/inativar, excluir). Só as faixas ATIVAS entram no cálculo da taxa
// (ver GET /api/public/lojas/:slug e a criação de pedido em public.ts), então
// a validação de sobreposição (`validarFaixasEntrega`) roda sempre sobre o
// conjunto de faixas ativas resultante da operação, nunca sobre as inativas.

adminRouter.get('/faixas-entrega', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const faixas = await prisma.faixaEntregaDistancia.findMany({
    where: { lojaId },
    orderBy: { distanciaMaxMetros: 'asc' },
  });
  res.json(faixas.map(serializarFaixaEntrega));
});

const faixaEntregaSchema = z.object({
  distanciaMaxMetros: z.number().int().positive(),
  valorEntrega: z.number().nonnegative(),
  ativo: z.boolean().optional(),
});

/** Valida que a faixa (nova ou editada) não colide em distância com as demais faixas ATIVAS da loja. */
async function validarSemSobreposicao(
  lojaId: string,
  faixaId: string | null,
  candidata: { distanciaMaxMetros: number; valorEntrega: number; ativo: boolean },
): Promise<string | null> {
  if (!candidata.ativo) return null; // inativa nunca disputa distância com outras

  const outrasAtivas = await prisma.faixaEntregaDistancia.findMany({
    where: { lojaId, ativo: true, ...(faixaId ? { id: { not: faixaId } } : {}) },
  });
  const conjunto = [
    ...outrasAtivas.map((f) => ({
      distanciaMaxMetros: f.distanciaMaxMetros,
      valorEntrega: Number(f.valorEntrega),
    })),
    { distanciaMaxMetros: candidata.distanciaMaxMetros, valorEntrega: candidata.valorEntrega },
  ];
  const validacao = validarFaixasEntrega(conjunto);
  return validacao.valido ? null : validacao.erro;
}

adminRouter.post('/faixas-entrega', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = faixaEntregaSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const ativo = parsed.data.ativo ?? true;
  const erroSobreposicao = await validarSemSobreposicao(lojaId, null, { ...parsed.data, ativo });
  if (erroSobreposicao) return res.status(400).json({ erro: erroSobreposicao });

  const faixa = await prisma.faixaEntregaDistancia.create({
    data: { ...parsed.data, ativo, lojaId },
  });
  res.status(201).json(serializarFaixaEntrega(faixa));
});

adminRouter.put('/faixas-entrega/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = faixaEntregaSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });

  const existente = await prisma.faixaEntregaDistancia.findFirst({
    where: { id: req.params.id, lojaId },
  });
  if (!existente) return res.status(404).json({ erro: 'Faixa não encontrada' });

  const candidata = {
    distanciaMaxMetros: parsed.data.distanciaMaxMetros ?? existente.distanciaMaxMetros,
    valorEntrega: parsed.data.valorEntrega ?? Number(existente.valorEntrega),
    ativo: parsed.data.ativo ?? existente.ativo,
  };
  const erroSobreposicao = await validarSemSobreposicao(lojaId, existente.id, candidata);
  if (erroSobreposicao) return res.status(400).json({ erro: erroSobreposicao });

  const faixa = await prisma.faixaEntregaDistancia.update({
    where: { id: existente.id },
    data: parsed.data,
  });
  res.json(serializarFaixaEntrega(faixa));
});

adminRouter.delete('/faixas-entrega/:id', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await prisma.faixaEntregaDistancia.findFirst({
    where: { id: req.params.id, lojaId },
  });
  if (!existente) return res.status(404).json({ erro: 'Faixa não encontrada' });

  await prisma.faixaEntregaDistancia.delete({ where: { id: existente.id } });
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

  // Cancelamento exige motivo — só o endpoint dedicado /cancelar pode gravar esse status.
  if (parsed.data.status === 'cancelado') {
    return res.status(400).json({ erro: 'Use o endpoint de cancelamento para cancelar um pedido' });
  }

  const existente = await prisma.pedido.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' });

  if (!transicaoValida(existente.status, parsed.data.status)) {
    return res.status(409).json({ erro: 'Transição de status inválida' });
  }

  const pedido = await prisma.pedido.update({
    where: { id: existente.id },
    data: { status: parsed.data.status },
  });
  res.json(serializarPedido(pedido));
});

const cancelarPedidoSchema = z.object({
  motivo: z.string().trim().min(3, 'Informe o motivo do cancelamento').max(300),
});

adminRouter.post('/pedidos/:id/cancelar', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const parsed = cancelarPedidoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0]?.message ?? 'Motivo inválido' });
  }

  const existente = await prisma.pedido.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' });

  if (!cancelamentoPermitido(existente.status)) {
    return res.status(409).json({ erro: 'Este pedido não pode mais ser cancelado' });
  }

  const pedido = await prisma.pedido.update({
    where: { id: existente.id },
    data: { status: 'cancelado', motivoCancelamento: parsed.data.motivo },
  });
  res.json(serializarPedido(pedido));
});

// Só esse endpoint (autenticado + escopado por lojaId do token) grava
// 'pagamento_confirmado' — o cliente nunca tem como chamar isso (ver
// POST /public/.../pix/informar-pagamento, que só chega até
// 'cliente_informou_pagamento'). "Já fiz o Pix" do cliente NUNCA é prova de
// pagamento; só o lojista confirma que o valor caiu na conta dele.
adminRouter.post('/pedidos/:id/pix/confirmar-pagamento', async (req, res) => {
  const lojaId = lojaIdOuErro(req, res);
  if (!lojaId) return;

  const existente = await prisma.pedido.findFirst({ where: { id: req.params.id, lojaId } });
  if (!existente) return res.status(404).json({ erro: 'Pedido não encontrado' });

  if (existente.formaPagamento !== 'pix') {
    return res.status(400).json({ erro: 'Este pedido não é um pagamento via Pix' });
  }
  if (existente.statusPagamento === 'pagamento_confirmado') {
    return res.status(409).json({ erro: 'Pagamento já confirmado anteriormente' });
  }

  const pedido = await prisma.pedido.update({
    where: { id: existente.id },
    data: { statusPagamento: 'pagamento_confirmado', pagamentoConfirmadoEm: new Date() },
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

// --- Aviso de novidades ---
// Versão é uma string simples (ex: "2026.08.1") definida no frontend, que já
// tem o conteúdo do aviso. O backend só guarda "qual foi a última versão que
// este usuário confirmou ter visto" — comparar e decidir se mostra é tudo do
// cliente, então uma futura novidade não exige nenhuma mudança aqui.

const versaoNovidadeSchema = z.object({
  versao: z.string().min(1).max(50),
});

adminRouter.get('/novidade-vista', requirePapel('dono_loja'), async (req, res) => {
  const usuarioId = usuarioIdOuErro(req, res);
  if (!usuarioId) return;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { novidadeVersaoVista: true },
  });
  res.json({ versao: usuario?.novidadeVersaoVista ?? null });
});

adminRouter.put('/novidade-vista', requirePapel('dono_loja'), async (req, res) => {
  const usuarioId = usuarioIdOuErro(req, res);
  if (!usuarioId) return;

  const parsed = versaoNovidadeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { novidadeVersaoVista: parsed.data.versao },
  });
  res.status(204).end();
});
