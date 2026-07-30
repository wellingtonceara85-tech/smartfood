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

export interface LojaPublica {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  tagline: string | null;
  endereco: string | null;
  telefoneWhatsapp: string;
  aberto: boolean;
  categorias: Categoria[];
}

export interface Loja {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  tagline: string | null;
  endereco: string | null;
  telefoneWhatsapp: string;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  abertoManual: boolean | null;
}

export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  preco: number;
  opcao: string | null;
  quantidade: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: 'dono_loja' | 'admin_master';
  lojaId: string | null;
}

export interface PedidoAnterior {
  id: string;
  clienteTelefone: string;
  itens: ItemCarrinho[];
  total: number;
  criadoEm: string;
}
