export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  fotoUrl: string | null;
  disponivel: boolean;
  opcoes: string[] | null;
  categoriaId: string;
  ordem: number;
}

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
  produtos: Produto[];
}

export interface BairroEntrega {
  id: string;
  nomeBairro: string;
  valorEntrega: number;
  ativo?: boolean;
}

export interface FaixaEntregaDistancia {
  id: string;
  distanciaMaxMetros: number;
  valorEntrega: number;
  ativo?: boolean;
}

export interface FaixaHorarioDia {
  abertura: string; // "HH:mm"
  fechamento: string; // "HH:mm" — pode ser menor que abertura (atravessa meia-noite)
}

export interface DiaHorarioFuncionamento {
  diaSemana: number; // 0=domingo .. 6=sábado, igual Date.getDay()
  ativo: boolean;
  faixas: FaixaHorarioDia[];
}

export type HorariosFuncionamento = DiaHorarioFuncionamento[];

export interface LojaPublica {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  capaUrl: string | null;
  tagline: string | null;
  endereco: string | null;
  chavePix: string | null;
  telefoneWhatsapp: string;
  aberto: boolean;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  horariosFuncionamento: HorariosFuncionamento | null;
  aceitaAgendamento: boolean;
  antecedenciaMinimaMinutos: number;
  corPrimaria: string;
  corSecundaria: string;
  categorias: Categoria[];
  bairrosEntrega: BairroEntrega[];
  calcularEntregaPorDistancia: boolean;
  latitude: number | null;
  longitude: number | null;
  faixasEntregaDistancia: FaixaEntregaDistancia[];
}

export type NivelAlertaTrial = 'ok' | 'moderado' | 'critico' | 'expirado' | 'sem_trial';

export interface TrialInfo {
  trialInicioEm: string | null;
  trialFimEm: string | null;
  diasRestantes: number | null;
  expirado: boolean;
  nivelAlerta: NivelAlertaTrial;
}

export interface Loja {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  capaUrl: string | null;
  tagline: string | null;
  endereco: string | null;
  chavePix: string | null;
  pixTipoChave: TipoChavePix | null;
  pixTitular: string | null;
  pixCidade: string | null;
  telefoneWhatsapp: string;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
  horariosFuncionamento: HorariosFuncionamento | null;
  aberto: boolean;
  corPrimaria: string;
  corSecundaria: string;
  aceitaAgendamento: boolean;
  antecedenciaMinimaMinutos: number;
  latitude: number | null;
  longitude: number | null;
  calcularEntregaPorDistancia: boolean;
  trial: TrialInfo;
}

export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  preco: number;
  opcao: string | null;
  quantidade: number;
  observacao: string | null;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: 'dono_loja' | 'admin_master';
  lojaId: string | null;
}

export type StatusLojaAdmin = 'aguardando_ativacao' | 'ativa' | 'suspensa';

export interface LojaAdmin {
  id: string;
  nome: string;
  slug: string;
  telefoneWhatsapp: string;
  status: StatusLojaAdmin;
  criadoEm: string;
  donoNome: string | null;
  donoEmail: string | null;
  donoAtivado: boolean;
  ativadoEm: string | null;
  ultimoAcessoEm: string | null;
  totalProdutos: number;
  totalPedidos: number;
  valorMovimentado: number;
  trial: TrialInfo;
}

export interface EtapaOnboarding {
  chave: 'conta_ativada' | 'primeiro_acesso' | 'produtos_cadastrados' | 'primeiro_pedido';
  rotulo: string;
  concluida: boolean;
}

export interface LojaAdminDetalhe extends LojaAdmin {
  endereco: string | null;
  suspensaEm: string | null;
  onboarding: EtapaOnboarding[];
}

export interface OverviewAdminMaster {
  totalLojas: number;
  ativas: number;
  aguardandoAtivacao: number;
  suspensas: number;
  lojistasComUsoRecente: number;
  totalPedidos: number;
  valorMovimentado: number;
  trialsVencendoEm7Dias: number;
  trialsExpirados: number;
}

export interface BoasVindasGeradas {
  linkAtivacao: string;
  linkCardapio: string;
  linkGuiaWhatsapp: string;
  mensagemBoasVindas: string;
}

export type StatusPedido =
  'recebido' | 'confirmado' | 'em_preparo' | 'pronto' | 'entregue' | 'finalizado' | 'cancelado';
export type FormaPagamento = 'dinheiro' | 'cartao' | 'pix';
export type TipoPedido = 'imediato' | 'agendado';
export type TipoChavePix = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';
/** Status do Pix manual — nunca o status operacional (kanban) do pedido. null = não se aplica (não é Pix, ou pedido de antes desta coluna existir). */
export type StatusPagamentoPix =
  'aguardando_pagamento' | 'cliente_informou_pagamento' | 'pagamento_confirmado';

/** Formato em que os itens ficam gravados dentro de um pedido já criado (Pedido.itens no backend) — diferente de ItemCarrinho. */
export interface ItemPedidoRegistrado {
  produtoId: string;
  nome: string;
  opcao: string | null;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  observacao: string | null;
}

export interface EnderecoEntregaPedido {
  entregaCep: string | null;
  entregaLogradouro: string | null;
  entregaNumero: string | null;
  entregaComplemento: string | null;
  entregaBairro: string | null;
  entregaCidade: string | null;
  entregaEstado: string | null;
  entregaReferencia: string | null;
}

/**
 * Formato mínimo devolvido por GET /pedidos/ultimo — endpoint público sem
 * autenticação do cliente, então nunca inclui nome/telefone/endereço (ver
 * backend/src/utils/pedidoPublico.ts). Usado só pra "Pedir de novo".
 */
export interface PedidoAnterior {
  itens: ItemPedidoRegistrado[];
  formaRecebimento: 'entrega' | 'retirada';
  bairroEntregaId: string | null;
  formaPagamento: FormaPagamento;
  precisaTroco: boolean | null;
  trocoPara: number | null;
  tipoCartao: 'debito' | 'credito' | null;
}

export interface PedidoAdmin extends EnderecoEntregaPedido {
  id: string;
  numero: number;
  clienteNome: string;
  clienteTelefone: string;
  itens: ItemPedidoRegistrado[];
  formaRecebimento: 'entrega' | 'retirada';
  bairroEntregaNome: string | null;
  valorEntrega: number;
  formaPagamento: FormaPagamento;
  precisaTroco: boolean | null;
  trocoPara: number | null;
  tipoCartao: 'debito' | 'credito' | null;
  statusPagamento: StatusPagamentoPix | null;
  pagamentoInformadoEm: string | null;
  pagamentoConfirmadoEm: string | null;
  status: StatusPedido;
  motivoCancelamento: string | null;
  tipoPedido: TipoPedido;
  dataAgendamento: string | null;
  total: number;
  criadoEm: string;
}

export interface PedidoAcompanhamento {
  id: string;
  numero: number;
  status: StatusPedido;
  itens: ItemPedidoRegistrado[];
  formaRecebimento: 'entrega' | 'retirada';
  bairroEntregaNome: string | null;
  total: number;
  criadoEm: string;
  tipoPedido: TipoPedido;
  dataAgendamento: string | null;
  loja: { nome: string };
}

export interface Pendencia {
  chave: string;
  titulo: string;
  descricao: string;
  rota: string;
}

// --- Onboarding guiado + cardápio assistido ---

export type StatusOnboarding = 'nao_iniciado' | 'em_andamento' | 'concluido';
export type MetodoCardapio = 'planilha' | 'colar_texto' | 'arquivo' | 'guiado' | 'manual';

export interface SegmentoOpcao {
  chave: string;
  rotulo: string;
}

export interface OnboardingLoja {
  id: string;
  status: StatusOnboarding;
  segmentoNegocio: string | null;
  etapaAtual: string | null;
  etapasConcluidas: string[] | null;
  metodoCardapio: MetodoCardapio | null;
  iniciadoEm: string | null;
  concluidoEm: string | null;
  segmentos?: SegmentoOpcao[];
}

export interface RascunhoCategoria {
  id: string;
  nome: string;
  ordem: number;
}

export interface RascunhoProduto {
  id: string;
  rascunhoCategoriaId: string | null;
  nome: string | null;
  descricao: string | null;
  preco: number | null;
  precoTexto: string | null;
  disponivel: boolean;
  fotoUrl: string | null;
  precisaRevisao: boolean;
  motivosRevisao: string[];
  possivelDuplicado: boolean;
  publicado: boolean;
  ordem: number;
}

export interface ResumoRascunho {
  totalProdutos: number;
  totalCategorias: number;
  duplicados: number;
  semDescricao: number;
  semFoto: number;
  precisaRevisao: number;
  publicaveis: number;
}

export interface RascunhoCardapio {
  id: string;
  origem: 'planilha' | 'colar_texto';
  status: 'rascunho' | 'publicado' | 'descartado';
  categorias: RascunhoCategoria[];
  produtos: RascunhoProduto[];
  resumo: ResumoRascunho;
}

export type StatusSolicitacaoCardapio =
  'recebido' | 'em_revisao' | 'aguardando_lojista' | 'aprovado' | 'concluido';

export interface SolicitacaoCardapioAssistido {
  id: string;
  origem: 'pdf' | 'imagem';
  nomeArquivoOriginal: string;
  status: StatusSolicitacaoCardapio;
  criadoEm: string;
  atualizadoEm: string;
}

export interface SolicitacaoCardapioAssistidoAdmin extends SolicitacaoCardapioAssistido {
  loja: { id: string; nome: string; slug: string };
  mimetype?: string;
  telefoneWhatsapp?: string;
}

export type CategoriaSugestao =
  'cardapio' | 'pedidos' | 'financeiro' | 'entregas' | 'relatorios' | 'outro';
export type StatusSugestao = 'nova' | 'em_analise' | 'planejada' | 'implementada' | 'nao_planejada';

export interface SugestaoLojista {
  id: string;
  categoria: CategoriaSugestao;
  mensagem: string;
  status: StatusSugestao;
  criadoEm: string;
}

export interface SugestaoLojistaAdmin extends SugestaoLojista {
  loja: { id: string; nome: string; slug: string };
}

export interface DashboardResumo {
  periodo: { inicio: string; fim: string };
  faturamentoTotal: number;
  totalPedidos: number;
  ticketMedio: number;
  produtoMaisVendido: { nome: string; quantidade: number } | null;
  clienteTop: {
    nome: string;
    telefone: string;
    totalGasto: number;
    totalPedidos: number;
  } | null;
}
