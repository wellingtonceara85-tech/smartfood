import { interpretarPreco } from './precoTexto';

export interface ItemPlanilhaCardapio {
  categoria: string | null;
  nome: string | null;
  descricao: string | null;
  preco: number | null;
  precoTexto: string | null;
  disponivel: boolean;
  observacoes: string | null;
  precisaRevisao: boolean;
  motivosRevisao: string[];
}

type LinhaPlanilha = Record<string, unknown>;

/** Remove acento e normaliza pra comparar nomes de coluna sem depender de exatidão de digitação. */
function normalizarCabecalho(cabecalho: string): string {
  return cabecalho.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

const ALIAS_COLUNAS: Record<
  keyof Omit<ItemPlanilhaCardapio, 'precisaRevisao' | 'motivosRevisao' | 'precoTexto'>,
  string[]
> = {
  categoria: ['categoria', 'grupo', 'secao', 'seção'],
  nome: ['produto', 'nome', 'item', 'nome do produto'],
  descricao: ['descricao', 'descrição', 'detalhes'],
  preco: ['preco', 'preço', 'valor', 'price'],
  disponivel: ['disponibilidade', 'disponivel', 'disponível', 'ativo', 'status'],
  observacoes: ['observacoes', 'observações', 'obs', 'observacao', 'observação'],
};

/** Acha, dentre os cabeçalhos normalizados da planilha, qual coluna corresponde a cada campo do domínio. */
function mapearColunas(cabecalhos: string[]): Record<string, string> {
  const normalizados = new Map(cabecalhos.map((c) => [normalizarCabecalho(c), c]));
  const mapa: Record<string, string> = {};

  for (const [campo, aliases] of Object.entries(ALIAS_COLUNAS)) {
    for (const alias of aliases) {
      const original = normalizados.get(alias);
      if (original) {
        mapa[campo] = original;
        break;
      }
    }
  }
  return mapa;
}

function valorTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto.length > 0 ? texto : null;
}

const VALORES_INDISPONIVEL = new Set([
  'nao',
  'não',
  'nao disponivel',
  'não disponível',
  'indisponivel',
  'indisponível',
  'inativo',
  'false',
  '0',
]);

function interpretarDisponibilidade(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === '') return true;
  if (typeof valor === 'boolean') return valor;
  const normalizado = normalizarCabecalho(String(valor));
  return !VALORES_INDISPONIVEL.has(normalizado);
}

/**
 * Recebe as linhas já extraídas de um `.xlsx`/`.csv` (array de objetos
 * cabeçalho→valor, como o `exceljs` entrega) e monta os itens do rascunho.
 * Tolera variações de nome de coluna (ALIAS_COLUNAS) mas nunca inventa preço
 * ou nome ausente — marca `precisaRevisao` sempre que não há certeza.
 */
export function parsePlanilhaCardapio(linhas: LinhaPlanilha[]): ItemPlanilhaCardapio[] {
  if (linhas.length === 0) return [];

  const cabecalhos = Object.keys(linhas[0]);
  const colunas = mapearColunas(cabecalhos);

  return linhas.map((linha) => {
    const nome = colunas.nome ? valorTexto(linha[colunas.nome]) : null;
    const precoBruto = colunas.preco ? linha[colunas.preco] : undefined;
    const { preco, precoTexto } = interpretarPrecoBruto(precoBruto);

    const motivosRevisao: string[] = [];
    if (!nome) motivosRevisao.push('sem_nome');
    if (preco === null) motivosRevisao.push('preco_nao_reconhecido');

    return {
      categoria: colunas.categoria ? valorTexto(linha[colunas.categoria]) : null,
      nome,
      descricao: colunas.descricao ? valorTexto(linha[colunas.descricao]) : null,
      preco,
      precoTexto,
      disponivel: colunas.disponivel ? interpretarDisponibilidade(linha[colunas.disponivel]) : true,
      observacoes: colunas.observacoes ? valorTexto(linha[colunas.observacoes]) : null,
      precisaRevisao: motivosRevisao.length > 0,
      motivosRevisao,
    };
  });
}

/** Célula de preço pode vir como número (xlsx) ou texto (csv) — nunca inventa valor quando ambíguo. */
function interpretarPrecoBruto(valor: unknown): {
  preco: number | null;
  precoTexto: string | null;
} {
  if (valor === null || valor === undefined || valor === '') {
    return { preco: null, precoTexto: null };
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) && valor > 0
      ? { preco: Math.round(valor * 100) / 100, precoTexto: null }
      : { preco: null, precoTexto: String(valor) };
  }
  const preco = interpretarPreco(String(valor));
  return { preco, precoTexto: preco === null ? String(valor).trim() : null };
}
