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
import { dataFimTrial } from '../utils/trial';
import { COR_PRIMARIA_PADRAO, COR_SECUNDARIA_PADRAO, corOuPadrao } from '../utils/cor';
import { coordenadaValida } from '../utils/distancia';
import {
  EnderecoEntregaNormalizado,
  normalizarTelefone,
  validarEnderecoEntrega,
} from '../utils/endereco';
import { calcularTaxaEntregaPorDistancia } from '../utils/entregaPedido';
import { calcularAberto } from '../utils/horario';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { montarMensagemPedido } from '../utils/mensagemWhatsapp';
import { projetarPedidoAnteriorPublico } from '../utils/pedidoPublico';

export const publicRouter = Router();

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
        include: { produtos: true },
      },
      bairrosEntrega: {
        where: { ativo: true },
        orderBy: { nomeBairro: 'asc' },
      },
      faixasEntregaDistancia: {
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
    aberto: calcularAberto(loja),
    horarioAbertura: loja.horarioAbertura,
    horarioFechamento: loja.horarioFechamento,
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
    const resultado = validarAgendamento(loja, dataAgendamentoUtc);
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

    const faixas = await prisma.faixaEntregaDistancia.findMany({ where: { lojaId: loja.id } });
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
      linkAcompanhamento,
      agendamentoFormatado: dataAgendamentoUtc ? formatarDataHoraLocal(dataAgendamentoUtc) : null,
    },
  );
  const linkWhatsapp = `https://wa.me/${loja.telefoneWhatsapp}?text=${encodeURIComponent(mensagem)}`;

  res.status(201).json({ pedido, mensagem, linkWhatsapp });
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
