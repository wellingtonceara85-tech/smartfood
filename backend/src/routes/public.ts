import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../env';
import { prisma } from '../prisma';
import {
  combinarDataHoraLocalParaUtc,
  formatarDataHoraLocal,
  validarAgendamento,
} from '../utils/agendamento';
import { conviteValido, hashToken } from '../utils/convite';
import { enviarEmailRecuperacaoSenha } from '../utils/emailRecuperacaoSenha';
import {
  dataExpiracaoRecuperacao,
  gerarTokenRecuperacao,
  tokenRecuperacaoValido,
} from '../utils/recuperacaoSenha';
import { dataFimTrial } from '../utils/trial';
import { HOSTNAMES_PRODUCAO_TURNSTILE, verificarTurnstile } from '../utils/turnstile';
import { COR_PRIMARIA_PADRAO, COR_SECUNDARIA_PADRAO, corOuPadrao } from '../utils/cor';
import { coordenadaValida } from '../utils/distancia';
import {
  EnderecoEntregaNormalizado,
  normalizarTelefone,
  validarEnderecoEntrega,
} from '../utils/endereco';
import { calcularTaxaEntregaPorDistancia } from '../utils/entregaPedido';
import { calcularAberto, HorariosFuncionamento } from '../utils/horario';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { montarMensagemPedido } from '../utils/mensagemWhatsapp';
import { projetarPedidoAnteriorPublico } from '../utils/pedidoPublico';
import { gerarPayloadPix, lojaTemDadosPixCompletos, TipoChavePix } from '../utils/pixPayload';

export const publicRouter = Router();

interface ItemPedidoSalvo {
  nome: string;
  opcao: string | null;
  quantidade: number;
  subtotal: number;
  observacao: string | null;
}

/**
 * Reconstrói mensagem + link do WhatsApp a partir de um Pedido já salvo —
 * usado só por /pix/informar-pagamento, pra mandar uma mensagem atualizada
 * (agora com "cliente informou pagamento") sem duplicar toda a lógica de
 * criação do pedido acima.
 */
function mensagemDoPedidoSalvo(
  loja: { nome: string; telefoneWhatsapp: string; slug: string; chavePix: string | null },
  pedido: {
    id: string;
    numero: number;
    clienteNome: string;
    clienteTelefone: string;
    itens: unknown;
    formaRecebimento: string;
    bairroEntregaNome: string | null;
    valorEntrega: unknown;
    entregaCep: string | null;
    entregaLogradouro: string | null;
    entregaNumero: string | null;
    entregaComplemento: string | null;
    entregaBairro: string | null;
    entregaCidade: string | null;
    entregaEstado: string | null;
    entregaReferencia: string | null;
    formaPagamento: string;
    precisaTroco: boolean | null;
    trocoPara: unknown;
    tipoCartao: string | null;
    total: unknown;
    tipoPedido: string;
    dataAgendamento: Date | null;
  },
  statusPagamentoPix:
    'aguardando_pagamento' | 'cliente_informou_pagamento' | 'pagamento_confirmado',
) {
  const enderecoValidado =
    pedido.formaRecebimento === 'entrega' &&
    pedido.entregaCep &&
    pedido.entregaLogradouro &&
    pedido.entregaNumero &&
    pedido.entregaBairro &&
    pedido.entregaCidade &&
    pedido.entregaEstado
      ? {
          cep: pedido.entregaCep,
          logradouro: pedido.entregaLogradouro,
          numero: pedido.entregaNumero,
          complemento: pedido.entregaComplemento,
          bairro: pedido.entregaBairro,
          cidade: pedido.entregaCidade,
          estado: pedido.entregaEstado,
          referencia: pedido.entregaReferencia,
        }
      : null;

  const linkAcompanhamento = `${env.frontendUrl}/${loja.slug}/pedido/${pedido.id}`;
  const mensagem = montarMensagemPedido(
    loja.nome,
    pedido.itens as ItemPedidoSalvo[],
    Number(pedido.total),
    {
      forma: pedido.formaRecebimento as 'entrega' | 'retirada',
      bairroNome: pedido.bairroEntregaNome,
      valorEntrega: Number(pedido.valorEntrega),
      endereco: enderecoValidado,
    },
    {
      numero: pedido.numero,
      clienteNome: pedido.clienteNome,
      clienteTelefone: pedido.clienteTelefone,
      formaPagamento: pedido.formaPagamento,
      precisaTroco: pedido.precisaTroco ?? false,
      trocoPara:
        pedido.trocoPara === null || pedido.trocoPara === undefined
          ? null
          : Number(pedido.trocoPara),
      tipoCartao: pedido.tipoCartao,
      chavePix: loja.chavePix,
      statusPagamentoPix,
      linkAcompanhamento,
      agendamentoFormatado:
        pedido.tipoPedido === 'agendado' && pedido.dataAgendamento
          ? formatarDataHoraLocal(pedido.dataAgendamento)
          : null,
    },
  );
  const linkWhatsapp = `https://wa.me/${loja.telefoneWhatsapp}?text=${encodeURIComponent(mensagem)}`;
  return { mensagem, linkWhatsapp };
}

// Limita tentativas de telefone nesse endpoint: ele não autentica o cliente
// (só filtra por loja+telefone), então sem isso alguém poderia varrer
// números de telefone em sequência tentando achar pedidos de terceiros.
// Best-effort: em Cloud Functions cada instância tem sua própria contagem
// em memória, não é um limite global garantido — ver risco residual
// documentado no relatório da missão.
const limitadorUltimoPedido = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

publicRouter.get('/lojas/:slug', async (req, res) => {
  const loja = await prisma.loja.findUnique({
    where: { slug: req.params.slug },
    include: {
      categorias: {
        orderBy: { ordem: 'asc' },
        include: { produtos: { orderBy: { ordem: 'asc' } } },
      },
      bairrosEntrega: {
        where: { ativo: true },
        orderBy: { nomeBairro: 'asc' },
      },
      faixasEntregaDistancia: {
        where: { ativo: true },
        orderBy: { distanciaMaxMetros: 'asc' },
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
    aberto: calcularAberto({
      ...loja,
      horariosFuncionamento: loja.horariosFuncionamento as HorariosFuncionamento | null,
    }),
    horarioAbertura: loja.horarioAbertura,
    horarioFechamento: loja.horarioFechamento,
    horariosFuncionamento: loja.horariosFuncionamento as HorariosFuncionamento | null,
    aceitaAgendamento: loja.aceitaAgendamento,
    antecedenciaMinimaMinutos: loja.antecedenciaMinimaMinutos,
    corPrimaria: corOuPadrao(loja.corPrimaria, COR_PRIMARIA_PADRAO),
    corSecundaria: corOuPadrao(loja.corSecundaria, COR_SECUNDARIA_PADRAO),
    bairrosEntrega: loja.bairrosEntrega.map((bairro) => ({
      id: bairro.id,
      nomeBairro: bairro.nomeBairro,
      valorEntrega: Number(bairro.valorEntrega),
    })),
    // Estratégia por distância é opt-in (loja.calcularEntregaPorDistancia) —
    // quando desligada, latitude/longitude/faixas não importam pro checkout,
    // que segue 100% no fluxo de bairro de sempre.
    calcularEntregaPorDistancia: loja.calcularEntregaPorDistancia,
    latitude: loja.latitude,
    longitude: loja.longitude,
    faixasEntregaDistancia: loja.faixasEntregaDistancia.map((faixa) => ({
      id: faixa.id,
      distanciaMaxMetros: faixa.distanciaMaxMetros,
      valorEntrega: Number(faixa.valorEntrega),
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

// Endpoint público, sem autenticação do cliente — devolve só o mínimo pra
// alimentar "Pedir de novo" (itens + preferências de pagamento). Nome,
// telefone e endereço NUNCA são devolvidos aqui: são reaproveitados via
// localStorage no próprio navegador do cliente (ver LojaPublica.tsx), não
// consultados no backend por telefone. Isso evita que alguém descubra dados
// de um cliente só sabendo (ou tentando) um número de telefone.
publicRouter.get('/lojas/:slug/pedidos/ultimo', limitadorUltimoPedido, async (req, res) => {
  const telefone = normalizarTelefone(String(req.query.telefone ?? ''));
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

  res.json(pedido ? projetarPedidoAnteriorPublico(pedido) : null);
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
    tipoPedido: pedido.tipoPedido,
    dataAgendamento: pedido.dataAgendamento,
    loja: { nome: loja.nome },
  });
});

const itemPedidoSchema = z.object({
  produtoId: z.string().uuid(),
  opcao: z.string().nullable().optional(),
  quantidade: z.number().int().min(1),
  observacao: z.string().max(280).nullable().optional(),
});

const enderecoEntregaSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().nullable().optional(),
  bairro: z.string(),
  cidade: z.string(),
  estado: z.string(),
  referencia: z.string().nullable().optional(),
});

const clienteLocalizacaoSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
  })
  .refine((valor) => coordenadaValida(valor.latitude, valor.longitude), {
    message: 'Localização inválida',
  });

const criarPedidoSchema = z.object({
  clienteNome: z.string().min(1),
  clienteTelefone: z.string().transform((valor, ctx) => {
    const normalizado = normalizarTelefone(valor);
    if (!normalizado) {
      ctx.addIssue({ code: 'custom', message: 'Telefone inválido — informe DDD + número' });
      return z.NEVER;
    }
    return normalizado;
  }),
  itens: z.array(itemPedidoSchema).min(1),
  formaRecebimento: z.enum(['entrega', 'retirada']),
  bairroEntregaId: z.string().uuid().nullable().optional(),
  enderecoEntrega: enderecoEntregaSchema.nullable().optional(),
  clienteLocalizacao: clienteLocalizacaoSchema.nullable().optional(),
  formaPagamento: z.enum(['dinheiro', 'cartao', 'pix']),
  precisaTroco: z.boolean().nullable().optional(),
  trocoPara: z.number().positive().nullable().optional(),
  tipoCartao: z.enum(['debito', 'credito']).nullable().optional(),
  tipoPedido: z.enum(['imediato', 'agendado']).default('imediato'),
  dataAgendamentoData: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  dataAgendamentoHora: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
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

  let dataAgendamentoUtc: Date | null = null;
  if (parsed.data.tipoPedido === 'agendado') {
    dataAgendamentoUtc = combinarDataHoraLocalParaUtc(
      parsed.data.dataAgendamentoData ?? '',
      parsed.data.dataAgendamentoHora ?? '',
    );
    if (!dataAgendamentoUtc) {
      return res.status(400).json({ erro: 'Informe data e horário válidos para o agendamento' });
    }
    const resultado = validarAgendamento(
      {
        ...loja,
        horariosFuncionamento: loja.horariosFuncionamento as HorariosFuncionamento | null,
      },
      dataAgendamentoUtc,
    );
    if (!resultado.valido) {
      return res.status(400).json({ erro: resultado.erro });
    }
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
    observacao: string | null;
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
      observacao: item.observacao?.trim() || null,
    });
  }

  const subtotalItens = itensResolvidos.reduce((soma, item) => soma + item.subtotal, 0);

  let valorEntrega = 0;
  let bairroEntregaNome: string | null = null;
  let enderecoValidado: EnderecoEntregaNormalizado | null = null;
  let clienteLatitude: number | null = null;
  let clienteLongitude: number | null = null;
  let entregaDistanciaMetros: number | null = null;

  if (parsed.data.formaRecebimento === 'entrega' && loja.calcularEntregaPorDistancia) {
    // Loja usa a estratégia por distância — bairro não entra em jogo aqui.
    // Endereço em texto continua obrigatório (mensagem do WhatsApp e
    // referência do entregador não dependem de coordenadas).
    const resultadoEndereco = validarEnderecoEntrega(parsed.data.enderecoEntrega);
    if (!resultadoEndereco.valido) {
      return res.status(400).json({ erro: resultadoEndereco.erro });
    }
    enderecoValidado = resultadoEndereco.endereco;

    const faixas = await prisma.faixaEntregaDistancia.findMany({
      where: { lojaId: loja.id, ativo: true },
    });
    const resultadoDistancia = calcularTaxaEntregaPorDistancia(
      loja,
      faixas.map((f) => ({
        distanciaMaxMetros: f.distanciaMaxMetros,
        valorEntrega: Number(f.valorEntrega),
      })),
      parsed.data.clienteLocalizacao,
    );
    if (!resultadoDistancia.ok) {
      return res.status(400).json({ erro: resultadoDistancia.erro });
    }
    valorEntrega = resultadoDistancia.valorEntrega;
    entregaDistanciaMetros = resultadoDistancia.distanciaMetros;
    clienteLatitude = resultadoDistancia.clienteLatitude;
    clienteLongitude = resultadoDistancia.clienteLongitude;
  } else if (parsed.data.formaRecebimento === 'entrega') {
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

    // Nunca confiar só na validação do frontend — endereço é revalidado aqui
    // mesmo que os campos existam no payload, incluindo casos de campo
    // desabilitado/oculto manipulado no cliente. O nome do bairro em
    // particular nunca vem do texto que o cliente enviou: vem do registro de
    // BairroEntrega que acabou de ser confirmado como ativo e desta loja —
    // o cliente só escolhe o bairro numa lista, nunca digita o nome dele.
    const resultadoEndereco = validarEnderecoEntrega({
      ...parsed.data.enderecoEntrega,
      bairro: bairro.nomeBairro,
    });
    if (!resultadoEndereco.valido) {
      return res.status(400).json({ erro: resultadoEndereco.erro });
    }
    enderecoValidado = resultadoEndereco.endereco;
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
        parsed.data.formaRecebimento === 'entrega' && !loja.calcularEntregaPorDistancia
          ? parsed.data.bairroEntregaId
          : null,
      bairroEntregaNome,
      valorEntrega,
      clienteLatitude,
      clienteLongitude,
      entregaDistanciaMetros,
      formaPagamento: parsed.data.formaPagamento,
      precisaTroco:
        parsed.data.formaPagamento === 'dinheiro' ? (parsed.data.precisaTroco ?? false) : null,
      trocoPara:
        parsed.data.formaPagamento === 'dinheiro' && parsed.data.precisaTroco
          ? parsed.data.trocoPara
          : null,
      tipoCartao: parsed.data.formaPagamento === 'cartao' ? parsed.data.tipoCartao : null,
      entregaCep: enderecoValidado?.cep ?? null,
      entregaLogradouro: enderecoValidado?.logradouro ?? null,
      entregaNumero: enderecoValidado?.numero ?? null,
      entregaComplemento: enderecoValidado?.complemento ?? null,
      entregaBairro: enderecoValidado?.bairro ?? null,
      entregaCidade: enderecoValidado?.cidade ?? null,
      entregaEstado: enderecoValidado?.estado ?? null,
      entregaReferencia: enderecoValidado?.referencia ?? null,
      tipoPedido: parsed.data.tipoPedido,
      dataAgendamento: dataAgendamentoUtc,
      total,
      // Só Pix ganha status de pagamento — outras formas ficam com null (não
      // se aplica), inclusive pedidos criados antes desta coluna existir.
      statusPagamento: parsed.data.formaPagamento === 'pix' ? 'aguardando_pagamento' : null,
    },
  });

  // Payload Pix (QR/copia-e-cola) — só quando a loja cadastrou os 4 dados
  // necessários (ver utils/pixPayload.ts); senão o Pix manual continua
  // funcionando só com a chave em texto, como já era antes desta missão.
  const pixPayload =
    parsed.data.formaPagamento === 'pix' && lojaTemDadosPixCompletos(loja)
      ? gerarPayloadPix(
          {
            chavePix: loja.chavePix,
            tipoChave: loja.pixTipoChave as TipoChavePix,
            titular: loja.pixTitular,
            cidade: loja.pixCidade,
          },
          total,
          `PED${numero}`,
        )
      : null;

  const linkAcompanhamento = `${env.frontendUrl}/${loja.slug}/pedido/${pedido.id}`;
  const mensagem = montarMensagemPedido(
    loja.nome,
    itensResolvidos,
    total,
    {
      forma: parsed.data.formaRecebimento,
      bairroNome: bairroEntregaNome,
      valorEntrega,
      endereco: enderecoValidado,
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
      statusPagamentoPix: parsed.data.formaPagamento === 'pix' ? 'aguardando_pagamento' : null,
      linkAcompanhamento,
      agendamentoFormatado: dataAgendamentoUtc ? formatarDataHoraLocal(dataAgendamentoUtc) : null,
    },
  );
  const linkWhatsapp = `https://wa.me/${loja.telefoneWhatsapp}?text=${encodeURIComponent(mensagem)}`;

  res.status(201).json({ pedido, mensagem, linkWhatsapp, pixPayload });
});

// Público, mas escopado por loja+id (mesmo padrão do rastreio do pedido
// acima) — o cliente só consegue informar pagamento do PRÓPRIO pedido, nunca
// de outro. Só avança 'aguardando_pagamento' -> 'cliente_informou_pagamento':
// nunca grava 'pagamento_confirmado' (isso é exclusivo do lojista, ver
// POST /admin/pedidos/:id/pix/confirmar-pagamento). "Já fiz o Pix" clicado
// pelo cliente NUNCA é prova de pagamento.
publicRouter.post('/lojas/:slug/pedidos/:id/pix/informar-pagamento', async (req, res) => {
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
  if (pedido.formaPagamento !== 'pix') {
    return res.status(400).json({ erro: 'Este pedido não é um pagamento via Pix' });
  }
  if (pedido.statusPagamento !== 'aguardando_pagamento') {
    // Já informado, já confirmado, ou estado inesperado — nada a fazer,
    // devolve o estado atual em vez de sobrescrever silenciosamente.
    const { mensagem, linkWhatsapp } = mensagemDoPedidoSalvo(
      loja,
      pedido,
      (pedido.statusPagamento as 'cliente_informou_pagamento' | 'pagamento_confirmado' | null) ??
        'aguardando_pagamento',
    );
    return res.json({ statusPagamento: pedido.statusPagamento, mensagem, linkWhatsapp });
  }

  const atualizado = await prisma.pedido.update({
    where: { id: pedido.id },
    data: { statusPagamento: 'cliente_informou_pagamento', pagamentoInformadoEm: new Date() },
  });
  const { mensagem, linkWhatsapp } = mensagemDoPedidoSalvo(
    loja,
    atualizado,
    'cliente_informou_pagamento',
  );
  res.json({ statusPagamento: atualizado.statusPagamento, mensagem, linkWhatsapp });
});

// --- Ativação de conta do dono da loja ---
//
// Rota pública (sem autenticação): o próprio token de convite, de uso único
// e alta entropia, é a prova de autorização — o Admin Master nunca vê nem
// define a senha do lojista (ver adminMaster.ts).

// Distingue "convite já usado" (o dono já ativou a conta antes e só precisa
// fazer login normalmente) de qualquer outro caso de link inválido/expirado —
// o frontend usa `motivo` para mostrar uma orientação diferente em cada caso.
function erroConvite(convite: { usadoEm: Date | null } | null) {
  if (convite?.usadoEm) {
    return { erro: 'Esta conta já foi ativada.', motivo: 'usado' as const };
  }
  return {
    erro: 'Link de ativação inválido, expirado ou já utilizado.',
    motivo: 'invalido' as const,
  };
}

publicRouter.get('/ativacao/:token', async (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const convite = await prisma.conviteAtivacao.findUnique({
    where: { tokenHash },
    include: { usuario: { include: { loja: true } } },
  });

  if (!convite || !conviteValido(convite)) {
    return res.status(400).json(erroConvite(convite));
  }

  res.json({
    nome: convite.usuario.nome,
    email: convite.usuario.email,
    lojaNome: convite.usuario.loja?.nome ?? null,
  });
});

const ativarContaSchema = z
  .object({
    senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
    confirmarSenha: z.string().min(1),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  });

publicRouter.post('/ativacao/:token', async (req, res) => {
  const parsed = ativarContaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const tokenHash = hashToken(req.params.token);
  const convite = await prisma.conviteAtivacao.findUnique({
    where: { tokenHash },
    include: { usuario: { include: { loja: true } } },
  });

  if (!convite || !conviteValido(convite)) {
    return res.status(400).json(erroConvite(convite));
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);
  const agora = new Date();

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: convite.usuarioId },
      data: { senhaHash, ativadoEm: agora, ultimoLoginEm: agora },
    }),
    prisma.conviteAtivacao.update({
      where: { id: convite.id },
      data: { usadoEm: agora },
    }),
    // Trial de 30 dias começa aqui — na ativação da conta do dono, não na criação da loja.
    // Só a primeira ativação inicia o trial: se por algum motivo já houver
    // trialInicioEm (ex.: reativação de convite após já ter ativado antes), não sobrescreve.
    ...(convite.usuario.lojaId && !convite.usuario.loja?.trialInicioEm
      ? [
          prisma.loja.update({
            where: { id: convite.usuario.lojaId },
            data: { trialInicioEm: agora, trialFimEm: dataFimTrial(agora) },
          }),
        ]
      : []),
  ]);

  // Ativação já deixa o lojista logado — evita um passo extra de login
  // logo após definir a senha, reaproveitando o mesmo formato de resposta
  // de /api/auth/login.
  const payload = {
    sub: convite.usuario.id,
    papel: convite.usuario.papel,
    lojaId: convite.usuario.lojaId,
  };
  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    usuario: {
      id: convite.usuario.id,
      nome: convite.usuario.nome,
      email: convite.usuario.email,
      papel: convite.usuario.papel,
      lojaId: convite.usuario.lojaId,
    },
  });
});

// --- Recuperação de senha self-service ---
//
// Deliberadamente um fluxo próprio, nunca reaproveitando ConviteAtivacao —
// ver utils/recuperacaoSenha.ts. Mesma resposta neutra sempre em
// /esqueci-senha, exista ou não o e-mail, pra nunca dar pra descobrir por
// tentativa quais e-mails têm conta no SmartFood.

function linkRedefinicaoSenha(tokenBruto: string): string {
  return `${env.frontendUrl}/redefinir-senha?token=${tokenBruto}`;
}

// Best-effort (em memória, por instância de Cloud Function — mesma ressalva
// documentada em limitadorUltimoPedido acima): limita quantas solicitações
// de recuperação um IP pode disparar, já que o endpoint sempre responde 200
// e seria um jeito barato de floodar e-mail se não tivesse nenhum limite.
const limitadorEsqueciSenha = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const MENSAGEM_NEUTRA_ESQUECI_SENHA =
  'Se esse e-mail estiver cadastrado e a conta já ativada, você vai receber um link para redefinir a senha em instantes.';

const esqueciSenhaSchema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().min(1, 'Verificação de segurança ausente'),
});

publicRouter.post('/esqueci-senha', limitadorEsqueciSenha, async (req, res) => {
  const parsed = esqueciSenhaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  // Turnstile some ANTES da resposta neutra — token ausente/inválido barra a
  // solicitação com um erro próprio (isso não revela nada sobre o e-mail,
  // só que a verificação de segurança falhou, igual aconteceria em
  // qualquer outro formulário do site que tivesse o mesmo captcha).
  //
  // Em produção, `TURNSTILE_SECRET_KEY` ausente é falha fechada (recusa a
  // solicitação) — nunca vira uma verificação pulada silenciosamente. Só em
  // dev/teste, sem a secret configurada, a verificação é pulada (com aviso
  // no console), pra não exigir conta na Cloudflare pra rodar localmente.
  if (!env.turnstileSecretKey) {
    if (env.nodeEnv === 'production') {
      console.warn(
        '[esqueci-senha] TURNSTILE_SECRET_KEY ausente em produção — solicitação recusada',
      );
      return res
        .status(400)
        .json({ erro: 'Verificação de segurança indisponível. Tente novamente mais tarde.' });
    }
    console.warn(
      '[esqueci-senha] TURNSTILE_SECRET_KEY não configurada — verificação pulada (dev/teste)',
    );
  } else {
    const turnstileValido = await verificarTurnstile(
      parsed.data.turnstileToken,
      env.turnstileSecretKey,
      {
        ip: req.ip,
        // Só valida hostname em produção — as sitekeys/secrets de teste da
        // Cloudflare usadas em dev/homologação devolvem "example.com", nunca
        // os hosts reais (ver HOSTNAMES_PRODUCAO_TURNSTILE em utils/turnstile.ts).
        hostnamesPermitidos:
          env.nodeEnv === 'production' ? HOSTNAMES_PRODUCAO_TURNSTILE : undefined,
      },
    );
    if (!turnstileValido) {
      return res
        .status(400)
        .json({ erro: 'Verificação de segurança inválida ou expirada. Tente novamente.' });
    }
  }

  // Nunca mentir pro usuário: se ninguém configurou o Resend ainda em
  // produção, não dá pra prometer que um link "vai chegar em instantes" —
  // essa checagem é sobre a capacidade do sistema como um todo, não sobre
  // um e-mail específico, então responder diferente aqui não vaza nada
  // sobre qual conta existe (é a mesma resposta pra qualquer e-mail).
  if (env.nodeEnv === 'production' && (!env.resendApiKey || !env.resendFromEmail)) {
    return res.status(503).json({
      erro: 'A recuperação de senha por e-mail está temporariamente indisponível. Entre em contato com o suporte do SmartFood.',
    });
  }

  // Sempre 200 com a mesma mensagem — a resposta nunca revela se o e-mail existe.
  res.json({ mensagem: MENSAGEM_NEUTRA_ESQUECI_SENHA });

  const usuario = await prisma.usuario.findUnique({ where: { email: parsed.data.email } });
  // Conta inexistente ou nunca ativada (senhaHash nulo) usa o fluxo de
  // ativação, não este — não faz sentido gerar recuperação pra ela.
  if (!usuario || !usuario.senhaHash) return;

  const { tokenBruto } = gerarTokenRecuperacao();
  const agora = new Date();

  await prisma.$transaction([
    // Qualquer solicitação anterior ainda pendente é revogada — só o link
    // mais recente pode ser usado, evita vários tokens válidos ao mesmo tempo.
    prisma.recuperacaoSenha.updateMany({
      where: { usuarioId: usuario.id, usadoEm: null, revogadoEm: null },
      data: { revogadoEm: agora },
    }),
    prisma.recuperacaoSenha.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: hashToken(tokenBruto),
        expiraEm: dataExpiracaoRecuperacao(agora),
      },
    }),
  ]);

  await enviarEmailRecuperacaoSenha({
    para: usuario.email,
    nome: usuario.nome,
    link: linkRedefinicaoSenha(tokenBruto),
  });
});

function erroRecuperacao(recuperacao: { usadoEm: Date | null } | null) {
  if (recuperacao?.usadoEm) {
    return { erro: 'Este link já foi utilizado.', motivo: 'usado' as const };
  }
  return {
    erro: 'Link de redefinição inválido ou expirado. Solicite um novo.',
    motivo: 'invalido' as const,
  };
}

publicRouter.get('/redefinir-senha/:token', async (req, res) => {
  const tokenHash = hashToken(req.params.token);
  const recuperacao = await prisma.recuperacaoSenha.findUnique({
    where: { tokenHash },
    include: { usuario: true },
  });

  if (!recuperacao || !tokenRecuperacaoValido(recuperacao)) {
    return res.status(400).json(erroRecuperacao(recuperacao));
  }

  res.json({ nome: recuperacao.usuario.nome });
});

const redefinirSenhaSchema = z
  .object({
    senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
    confirmarSenha: z.string().min(1),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  });

publicRouter.post('/redefinir-senha/:token', async (req, res) => {
  const parsed = redefinirSenhaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const tokenHash = hashToken(req.params.token);
  const recuperacao = await prisma.recuperacaoSenha.findUnique({
    where: { tokenHash },
    include: { usuario: true },
  });

  if (!recuperacao || !tokenRecuperacaoValido(recuperacao)) {
    return res.status(400).json(erroRecuperacao(recuperacao));
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);
  const agora = new Date();

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: recuperacao.usuarioId }, data: { senhaHash } }),
    prisma.recuperacaoSenha.update({ where: { id: recuperacao.id }, data: { usadoEm: agora } }),
  ]);

  // Sem login automático de propósito (diferente da ativação) — o lojista
  // confirma que a senha nova funciona entrando normalmente pelo /login.
  res.status(204).send();
});
