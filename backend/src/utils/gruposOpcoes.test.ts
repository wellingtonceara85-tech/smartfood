import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  GrupoOpcoesValidacao,
  GrupoParaCriar,
  grupoParaCriarSemProdutoId,
  gruposParaCriarSemProdutoId,
  ProdutoParaResolucaoItem,
  resolverItemPedido,
  validarGruposSelecionados,
} from './gruposOpcoes';

const proteinas: GrupoOpcoesValidacao = {
  id: 'grupo-proteinas',
  nome: 'Proteínas',
  minEscolhas: 1,
  maxEscolhas: 1,
  obrigatorio: true,
  ativo: true,
  opcoes: [
    { id: 'frango', nome: 'Frango', precoAdicional: 0, ativo: true },
    { id: 'carne', nome: 'Carne', precoAdicional: 0, ativo: true },
    { id: 'inativa', nome: 'Descontinuada', precoAdicional: 0, ativo: false },
  ],
};

const acompanhamentos: GrupoOpcoesValidacao = {
  id: 'grupo-acompanhamentos',
  nome: 'Acompanhamentos',
  minEscolhas: 0,
  maxEscolhas: 3,
  obrigatorio: false,
  ativo: true,
  opcoes: [
    { id: 'arroz', nome: 'Arroz', precoAdicional: 0, ativo: true },
    { id: 'feijao', nome: 'Feijão', precoAdicional: 0, ativo: true },
    { id: 'macarrao', nome: 'Macarrão', precoAdicional: 0, ativo: true },
    { id: 'farofa', nome: 'Farofa', precoAdicional: 0, ativo: true },
  ],
};

const retirar: GrupoOpcoesValidacao = {
  id: 'grupo-retirar',
  nome: 'Deseja retirar algo?',
  minEscolhas: 0,
  maxEscolhas: 4,
  obrigatorio: false,
  ativo: true,
  opcoes: [
    { id: 'alface', nome: 'Alface', precoAdicional: 0, ativo: true },
    { id: 'tomate', nome: 'Tomate', precoAdicional: 0, ativo: true },
  ],
};

const adicionais: GrupoOpcoesValidacao = {
  id: 'grupo-adicionais',
  nome: 'Adicionais',
  minEscolhas: 0,
  maxEscolhas: 2,
  obrigatorio: false,
  ativo: true,
  opcoes: [
    { id: 'ovo', nome: 'Ovo', precoAdicional: 2, ativo: true },
    { id: 'bacon', nome: 'Bacon', precoAdicional: 3, ativo: true },
  ],
};

const grupoInativo: GrupoOpcoesValidacao = {
  id: 'grupo-inativo',
  nome: 'Grupo desativado',
  minEscolhas: 0,
  maxEscolhas: 1,
  obrigatorio: false,
  ativo: false,
  opcoes: [{ id: 'x', nome: 'X', precoAdicional: 0, ativo: true }],
};

// 1. Escolha única -----------------------------------------------------

test('escolha única: aceita exatamente uma opção do grupo obrigatório', () => {
  const resultado = validarGruposSelecionados(
    [proteinas],
    [{ grupoId: 'grupo-proteinas', opcaoIds: ['frango'] }],
  );
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.deepEqual(resultado.grupos, [
      { nome: 'Proteínas', opcoes: [{ nome: 'Frango', precoAdicional: 0 }] },
    ]);
    assert.equal(resultado.adicionalTotal, 0);
  }
});

test('escolha única: rejeita duas opções quando máximo é 1', () => {
  const resultado = validarGruposSelecionados(
    [proteinas],
    [{ grupoId: 'grupo-proteinas', opcaoIds: ['frango', 'carne'] }],
  );
  assert.equal(resultado.ok, false);
});

// 2. Múltipla escolha ----------------------------------------------------

test('múltipla escolha: aceita várias opções dentro do máximo', () => {
  const resultado = validarGruposSelecionados(
    [acompanhamentos],
    [{ grupoId: 'grupo-acompanhamentos', opcaoIds: ['arroz', 'feijao', 'macarrao'] }],
  );
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.grupos[0].opcoes.length, 3);
  }
});

// 3. Mínimo obrigatório ----------------------------------------------------

test('mínimo obrigatório: bloqueia quando nenhuma opção foi escolhida em grupo obrigatório', () => {
  const resultado = validarGruposSelecionados([proteinas], []);
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.match(resultado.erro, /Proteínas/);
});

test('mínimo obrigatório: bloqueia quando escolhas ficam abaixo de minEscolhas', () => {
  const grupoMinDois: GrupoOpcoesValidacao = {
    ...acompanhamentos,
    minEscolhas: 2,
  };
  const resultado = validarGruposSelecionados(
    [grupoMinDois],
    [{ grupoId: 'grupo-acompanhamentos', opcaoIds: ['arroz'] }],
  );
  assert.equal(resultado.ok, false);
});

// 4. Máximo permitido ----------------------------------------------------

test('máximo permitido: bloqueia quando excede maxEscolhas', () => {
  const resultado = validarGruposSelecionados(
    [acompanhamentos],
    [{ grupoId: 'grupo-acompanhamentos', opcaoIds: ['arroz', 'feijao', 'macarrao', 'farofa'] }],
  );
  assert.equal(resultado.ok, false);
});

// 5. Grupo opcional ----------------------------------------------------

test('grupo opcional: passa sem nenhuma escolha', () => {
  const resultado = validarGruposSelecionados([acompanhamentos], []);
  assert.equal(resultado.ok, true);
  if (resultado.ok) assert.deepEqual(resultado.grupos, []);
});

// 6. Múltiplas opções de retirada ----------------------------------------------------

test('múltiplas opções de retirada: aceita várias opções num grupo opcional de retirada', () => {
  const resultado = validarGruposSelecionados(
    [retirar],
    [{ grupoId: 'grupo-retirar', opcaoIds: ['alface', 'tomate'] }],
  );
  assert.equal(resultado.ok, true);
  if (resultado.ok) assert.equal(resultado.grupos[0].opcoes.length, 2);
});

// 7 e 8. Adicional R$0 e adicional com preço ----------------------------------------------------

test('adicional R$0 não altera o total; adicional com preço soma ao total', () => {
  const resultado = validarGruposSelecionados(
    [adicionais],
    [{ grupoId: 'grupo-adicionais', opcaoIds: ['ovo', 'bacon'] }],
  );
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.adicionalTotal, 5);
    assert.deepEqual(resultado.grupos[0].opcoes, [
      { nome: 'Ovo', precoAdicional: 2 },
      { nome: 'Bacon', precoAdicional: 3 },
    ]);
  }
});

// 17. Grupo/opção inativos ----------------------------------------------------

test('grupo inativo é ignorado (nunca exigido, mesmo que fosse obrigatório)', () => {
  const resultado = validarGruposSelecionados([grupoInativo], []);
  assert.equal(resultado.ok, true);
});

test('opção inativa não pode ser escolhida mesmo pertencendo a um grupo ativo', () => {
  const resultado = validarGruposSelecionados(
    [proteinas],
    [{ grupoId: 'grupo-proteinas', opcaoIds: ['inativa'] }],
  );
  assert.equal(resultado.ok, false);
});

// 18. Validação contra manipulação ----------------------------------------------------

test('rejeita seleção de um grupo que não existe/não pertence ao produto', () => {
  const resultado = validarGruposSelecionados(
    [proteinas],
    [{ grupoId: 'grupo-inexistente', opcaoIds: ['x'] }],
  );
  assert.equal(resultado.ok, false);
});

test('rejeita seleção de um grupo desativado (não pode ser burlado pelo request)', () => {
  const resultado = validarGruposSelecionados(
    [grupoInativo],
    [{ grupoId: 'grupo-inativo', opcaoIds: ['x'] }],
  );
  assert.equal(resultado.ok, false);
});

test('IDs de opção duplicados no request contam uma vez só (não driblam o máximo real)', () => {
  const resultado = validarGruposSelecionados(
    [proteinas],
    [{ grupoId: 'grupo-proteinas', opcaoIds: ['frango', 'frango'] }],
  );
  assert.equal(resultado.ok, true);
  if (resultado.ok) assert.equal(resultado.grupos[0].opcoes.length, 1);
});

// --- resolverItemPedido: cálculo do item / produto indisponível / legado ---

const produtoComGrupos: ProdutoParaResolucaoItem = {
  id: 'produto-1',
  nome: 'Almoço',
  preco: 16,
  disponivel: true,
  gruposOpcoes: [proteinas, adicionais],
};

test('9. cálculo do item: preço final soma base + adicionais, multiplicado pela quantidade', () => {
  const resultado = resolverItemPedido(produtoComGrupos, {
    opcao: null,
    gruposSelecionados: [
      { grupoId: 'grupo-proteinas', opcaoIds: ['frango'] },
      { grupoId: 'grupo-adicionais', opcaoIds: ['ovo', 'bacon'] },
    ],
    quantidade: 2,
    observacao: null,
  });
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.item.precoUnitario, 21); // 16 + 2 + 3
    assert.equal(resultado.item.subtotal, 42); // 21 * 2
  }
});

test('14/15. produto indisponível nunca é resolvido, mesmo por request direto', () => {
  const resultado = resolverItemPedido(
    { ...produtoComGrupos, disponivel: false },
    {
      opcao: null,
      gruposSelecionados: [{ grupoId: 'grupo-proteinas', opcaoIds: ['frango'] }],
      quantidade: 1,
      observacao: null,
    },
  );
  assert.equal(resultado.ok, false);
  if (!resultado.ok) assert.match(resultado.erro, /indisponível/);
});

test('18. manipulação: request não pode inflar o preço enviando precoAdicional próprio (ignorado, só grupoId/opcaoId importam)', () => {
  const payloadMalicioso = [
    { grupoId: 'grupo-proteinas', opcaoIds: ['frango'], precoAdicional: 999 },
  ] as unknown as { grupoId: string; opcaoIds: string[] }[];
  const resultado = resolverItemPedido(produtoComGrupos, {
    opcao: null,
    gruposSelecionados: payloadMalicioso,
    quantidade: 1,
    observacao: null,
  });
  assert.equal(resultado.ok, true);
  if (resultado.ok) assert.equal(resultado.item.precoUnitario, 16);
});

// 13. Compatibilidade com produto antigo (sem GrupoOpcoes, só opção legada) ---

test('13. produto legado sem GrupoOpcoes: opção legada passa direto, sem exigir nenhum grupo', () => {
  const produtoLegado: ProdutoParaResolucaoItem = {
    id: 'produto-legado',
    nome: 'Espetinho',
    preco: 8,
    disponivel: true,
    gruposOpcoes: [],
  };
  const resultado = resolverItemPedido(produtoLegado, {
    opcao: 'Carne',
    gruposSelecionados: [],
    quantidade: 3,
    observacao: null,
  });
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.item.opcao, 'Carne');
    assert.equal(resultado.item.grupos.length, 0);
    assert.equal(resultado.item.subtotal, 24);
  }
});

test('produto legado rejeita gruposSelecionados forjados (produto não tem esse grupo)', () => {
  const produtoLegado: ProdutoParaResolucaoItem = {
    id: 'produto-legado',
    nome: 'Espetinho',
    preco: 8,
    disponivel: true,
    gruposOpcoes: [],
  };
  const resultado = resolverItemPedido(produtoLegado, {
    opcao: null,
    gruposSelecionados: [{ grupoId: 'grupo-que-nao-existe', opcaoIds: ['x'] }],
    quantidade: 1,
    observacao: null,
  });
  assert.equal(resultado.ok, false);
});

// 10. cálculo do pedido (soma de vários itens) ---

test('10. cálculo do pedido: subtotal total soma o subtotal de todos os itens resolvidos', () => {
  const item1 = resolverItemPedido(produtoComGrupos, {
    opcao: null,
    gruposSelecionados: [{ grupoId: 'grupo-proteinas', opcaoIds: ['carne'] }],
    quantidade: 1,
    observacao: null,
  });
  const item2 = resolverItemPedido(
    { ...produtoComGrupos, id: 'produto-2', nome: 'Suco', preco: 6, gruposOpcoes: [] },
    { opcao: null, gruposSelecionados: [], quantidade: 2, observacao: null },
  );
  assert.equal(item1.ok, true);
  assert.equal(item2.ok, true);
  if (item1.ok && item2.ok) {
    const total = item1.item.subtotal + item2.item.subtotal;
    assert.equal(total, 16 + 12);
  }
});

// --- grupoParaCriarSemProdutoId / gruposParaCriarSemProdutoId ---
//
// Reproduz o bug relatado na homologação: um grupo existente é editado
// (minEscolhas, maxEscolhas, obrigatorio, ativo, nome, preço adicional das
// opções) e salvo de novo — essa é a única transformação usada tanto por
// POST /produtos, PUT /produtos/:id quanto por PUT
// /produtos/:produtoId/grupos-opcoes pra moldar o "create" que o Prisma
// grava. Se ela perder ou ignorar algum desses campos, os três endpoints
// perdem junto — por isso testada aqui isolada, sem precisar de banco.

const grupoOriginal: GrupoParaCriar = {
  nome: 'Deseja retirar algum ingrediente?',
  minEscolhas: 1,
  maxEscolhas: 5,
  obrigatorio: false,
  ativo: true,
  ordem: 1,
  opcoes: [
    { nome: 'Alface', precoAdicional: 0, ativo: true, ordem: 0 },
    { nome: 'Tomate', precoAdicional: 0, ativo: true, ordem: 1 },
  ],
};

test('atualização de maxEscolhas: 5 -> 4 é refletida no create gerado (reprodução exata do bug relatado)', () => {
  const editado: GrupoParaCriar = { ...grupoOriginal, maxEscolhas: 4 };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.equal(resultado.maxEscolhas, 4);
});

test('atualização de minEscolhas é refletida no create gerado', () => {
  const editado: GrupoParaCriar = { ...grupoOriginal, minEscolhas: 2 };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.equal(resultado.minEscolhas, 2);
});

test('atualização de obrigatorio (false -> true) é refletida no create gerado', () => {
  const editado: GrupoParaCriar = { ...grupoOriginal, obrigatorio: true };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.equal(resultado.obrigatorio, true);
});

test('atualização de ativo (true -> false) é refletida no create gerado', () => {
  const editado: GrupoParaCriar = { ...grupoOriginal, ativo: false };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.equal(resultado.ativo, false);
});

test('atualização do nome do grupo é refletida no create gerado', () => {
  const editado: GrupoParaCriar = { ...grupoOriginal, nome: 'Retirar ingrediente' };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.equal(resultado.nome, 'Retirar ingrediente');
});

test('atualização do preço adicional de uma opção é refletida no create gerado', () => {
  const editado: GrupoParaCriar = {
    ...grupoOriginal,
    opcoes: [
      { nome: 'Alface', precoAdicional: 1.5, ativo: true, ordem: 0 },
      { nome: 'Tomate', precoAdicional: 0, ativo: true, ordem: 1 },
    ],
  };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.equal(resultado.opcoes.create[0].precoAdicional, 1.5);
  assert.equal(resultado.opcoes.create[1].precoAdicional, 0);
});

test('as 6 edições do cenário relatado, aplicadas juntas, chegam todas ao resultado final', () => {
  const editado: GrupoParaCriar = {
    nome: 'Retirar ingrediente',
    minEscolhas: 0,
    maxEscolhas: 4,
    obrigatorio: true,
    ativo: false,
    ordem: 1,
    opcoes: [{ nome: 'Bacon', precoAdicional: 3.5, ativo: true, ordem: 0 }],
  };
  const resultado = grupoParaCriarSemProdutoId(editado, 1);
  assert.deepEqual(resultado, {
    nome: 'Retirar ingrediente',
    minEscolhas: 0,
    maxEscolhas: 4,
    obrigatorio: true,
    ativo: false,
    ordem: 1,
    opcoes: { create: [{ nome: 'Bacon', precoAdicional: 3.5, ativo: true, ordem: 0 }] },
  });
});

test('gruposParaCriarSemProdutoId aplica a mesma transformação em lista, preservando cada grupo', () => {
  const resultado = gruposParaCriarSemProdutoId([
    grupoOriginal,
    { ...grupoOriginal, nome: 'Adicionais', maxEscolhas: 3 },
  ]);
  assert.equal(resultado.length, 2);
  assert.equal(resultado[0].nome, 'Deseja retirar algum ingrediente?');
  assert.equal(resultado[1].nome, 'Adicionais');
  assert.equal(resultado[1].maxEscolhas, 3);
});

test('ordem cai pro índice na lista quando o grupo/opção não informa a própria ordem', () => {
  const semOrdem: GrupoParaCriar = {
    nome: 'Molhos',
    minEscolhas: 0,
    maxEscolhas: 2,
    obrigatorio: false,
    ativo: true,
    opcoes: [{ nome: 'Barbecue', precoAdicional: 0, ativo: true }],
  };
  const resultado = grupoParaCriarSemProdutoId(semOrdem, 2);
  assert.equal(resultado.ordem, 2);
  assert.equal(resultado.opcoes.create[0].ordem, 0);
});
