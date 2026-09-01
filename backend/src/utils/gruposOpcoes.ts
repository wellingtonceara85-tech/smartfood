/**
 * Validação e resolução de itens de pedido com Grupos de Opções — mecanismo
 * novo e genérico (Missão "Grupos de opções"), que convive com o mecanismo
 * legado de opção única em Produto.opcoes (nunca migrado, nunca invalidado).
 *
 * Tudo aqui é puro (sem Prisma/Express) de propósito: o backend é a fonte
 * confiável de preço/regras (nunca o frontend), e mantendo essa lógica pura
 * ela fica testável sem banco — ver gruposOpcoes.test.ts.
 */

export interface OpcaoParaCriar {
  nome: string;
  precoAdicional: number;
  ativo: boolean;
  ordem?: number;
}

export interface GrupoParaCriar {
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  ativo: boolean;
  ordem?: number;
  opcoes: OpcaoParaCriar[];
}

/**
 * Molda um grupo (já validado pelo zod) pro formato de "create" aninhado do
 * Prisma (sem produtoId — quem chama decide se é um nested write dentro de
 * `produto.create`/`update` ou uma linha própria em `grupoOpcoes.create`).
 * Única fonte dessa transformação: usada tanto na criação do produto quanto
 * na atualização (PUT /produtos/:id) quanto no endpoint dedicado de grupos —
 * nenhuma das três reimplementa o mapeamento campo a campo, então nenhuma
 * pode divergir silenciosamente de qual campo é (ou deixa de ser) persistido.
 */
export function grupoParaCriarSemProdutoId(grupo: GrupoParaCriar, indiceGrupo: number) {
  return {
    nome: grupo.nome,
    minEscolhas: grupo.minEscolhas,
    maxEscolhas: grupo.maxEscolhas,
    obrigatorio: grupo.obrigatorio,
    ativo: grupo.ativo,
    ordem: grupo.ordem ?? indiceGrupo,
    opcoes: {
      create: grupo.opcoes.map((opcao, indiceOpcao) => ({
        nome: opcao.nome,
        precoAdicional: opcao.precoAdicional,
        ativo: opcao.ativo,
        ordem: opcao.ordem ?? indiceOpcao,
      })),
    },
  };
}

/** Aplica grupoParaCriarSemProdutoId a uma lista inteira, preservando a ordem de entrada como ordem padrão. */
export function gruposParaCriarSemProdutoId(grupos: GrupoParaCriar[]) {
  return grupos.map((grupo, indice) => grupoParaCriarSemProdutoId(grupo, indice));
}

export interface OpcaoGrupoValidacao {
  id: string;
  nome: string;
  precoAdicional: number;
  ativo: boolean;
}

export interface GrupoOpcoesValidacao {
  id: string;
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  ativo: boolean;
  opcoes: OpcaoGrupoValidacao[];
}

export interface GrupoSelecionadoEntrada {
  grupoId: string;
  opcaoIds: string[];
}

export interface OpcaoResolvida {
  nome: string;
  precoAdicional: number;
}

export interface GrupoResolvido {
  nome: string;
  opcoes: OpcaoResolvida[];
}

export type ResultadoValidacaoGrupos =
  { ok: true; grupos: GrupoResolvido[]; adicionalTotal: number } | { ok: false; erro: string };

/**
 * Valida as escolhas do cliente contra as regras cadastradas pelo lojista
 * (min/máx, obrigatoriedade, opção ativa) e resolve nome + preço de cada
 * escolha — nunca confia em nome/preço vindos do cliente, só em `grupoId`/
 * `opcaoId`, sempre resolvidos aqui contra o que veio do banco.
 */
export function validarGruposSelecionados(
  grupos: GrupoOpcoesValidacao[],
  selecionados: GrupoSelecionadoEntrada[],
): ResultadoValidacaoGrupos {
  const gruposAtivos = grupos.filter((grupo) => grupo.ativo);
  const gruposAtivosPorId = new Map(gruposAtivos.map((grupo) => [grupo.id, grupo]));

  // Qualquer grupo referenciado que não exista/esteja inativo neste produto é
  // sinal de manipulação do request (o cliente só pode ver grupos ativos no
  // cardápio público) — barra antes de processar qualquer coisa.
  for (const selecionado of selecionados) {
    if (!gruposAtivosPorId.has(selecionado.grupoId)) {
      return { ok: false, erro: 'Grupo de opções inválido para este produto' };
    }
  }

  const selecionadosPorGrupoId = new Map(selecionados.map((s) => [s.grupoId, s]));
  const grupos_: GrupoResolvido[] = [];
  let adicionalTotal = 0;

  for (const grupo of gruposAtivos) {
    const idsUnicos = [...new Set(selecionadosPorGrupoId.get(grupo.id)?.opcaoIds ?? [])];

    if (idsUnicos.length === 0) {
      if (grupo.obrigatorio || grupo.minEscolhas > 0) {
        return { ok: false, erro: `Escolha uma opção em "${grupo.nome}"` };
      }
      continue;
    }

    if (idsUnicos.length < grupo.minEscolhas) {
      return {
        ok: false,
        erro: `Escolha pelo menos ${grupo.minEscolhas} opção(ões) em "${grupo.nome}"`,
      };
    }
    if (idsUnicos.length > grupo.maxEscolhas) {
      return {
        ok: false,
        erro: `Escolha no máximo ${grupo.maxEscolhas} opção(ões) em "${grupo.nome}"`,
      };
    }

    const opcoesAtivasPorId = new Map(
      grupo.opcoes.filter((opcao) => opcao.ativo).map((opcao) => [opcao.id, opcao]),
    );
    const opcoesResolvidas: OpcaoResolvida[] = [];
    for (const id of idsUnicos) {
      const opcao = opcoesAtivasPorId.get(id);
      if (!opcao) {
        return { ok: false, erro: `Opção inválida em "${grupo.nome}"` };
      }
      opcoesResolvidas.push({ nome: opcao.nome, precoAdicional: opcao.precoAdicional });
      adicionalTotal += opcao.precoAdicional;
    }

    grupos_.push({ nome: grupo.nome, opcoes: opcoesResolvidas });
  }

  return { ok: true, grupos: grupos_, adicionalTotal };
}

export interface ProdutoParaResolucaoItem {
  id: string;
  nome: string;
  preco: number;
  disponivel: boolean;
  gruposOpcoes: GrupoOpcoesValidacao[];
}

export interface ItemPedidoEntrada {
  opcao: string | null;
  gruposSelecionados: GrupoSelecionadoEntrada[];
  quantidade: number;
  observacao: string | null;
}

export interface ItemPedidoResolvido {
  produtoId: string;
  nome: string;
  opcao: string | null;
  grupos: GrupoResolvido[];
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  observacao: string | null;
}

export type ResultadoResolucaoItem =
  { ok: true; item: ItemPedidoResolvido } | { ok: false; erro: string };

/**
 * Resolve um item de pedido completo: disponibilidade do produto, escolhas de
 * grupos (min/máx/preço) e cálculo do preço final — usado tanto pra montar o
 * pedido quanto (indiretamente) validado de novo a cada request, nunca
 * confiando em preço/opções vindos do cliente.
 */
export function resolverItemPedido(
  produto: ProdutoParaResolucaoItem,
  entrada: ItemPedidoEntrada,
): ResultadoResolucaoItem {
  if (!produto.disponivel) {
    return { ok: false, erro: `Produto "${produto.nome}" está indisponível` };
  }

  const resultadoGrupos = validarGruposSelecionados(
    produto.gruposOpcoes,
    entrada.gruposSelecionados,
  );
  if (!resultadoGrupos.ok) {
    return { ok: false, erro: resultadoGrupos.erro };
  }

  const precoUnitario = produto.preco + resultadoGrupos.adicionalTotal;
  const subtotal = precoUnitario * entrada.quantidade;

  return {
    ok: true,
    item: {
      produtoId: produto.id,
      nome: produto.nome,
      opcao: entrada.opcao ?? null,
      grupos: resultadoGrupos.grupos,
      quantidade: entrada.quantidade,
      precoUnitario,
      subtotal,
      observacao: entrada.observacao?.trim() || null,
    },
  };
}
