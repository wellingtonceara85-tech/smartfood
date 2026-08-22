export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  fotoUrl: string | null;
  disponivel: boolean;
  opcoes: string[] | null;
  categoriaId?: string;
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
  aceitaAgendamento: boolean;
  antecedenciaMinimaMinutos: number;
  corPrimaria: string;
  corSecundaria: string;
  categorias: Categoria[];
  bairrosEntrega: BairroEntrega[];
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
  telefoneWhatsapp: string;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
  corPrimaria: string;
  corSecundaria: string;
  aceitaAgendamento: boolean;
  antecedenciaMinimaMinutos: number;
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

export type StatusPedido = 'recebido' | 'em_preparo' | 'pronto' | 'entregue' | 'finalizado';
export type FormaPagamento = 'dinheiro' | 'cartao' | 'pix';
export type TipoPedido = 'imediato' | 'agendado';

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
  status: StatusPedido;
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
