import { describe, expect, it } from 'vitest';
import {
  agruparProdutosPorCategoria,
  chaveItemCarrinho,
  deveUsarOpcoesLegado,
  produtoConfiguravel,
  rotuloProdutoIncompleto,
  rotuloRegraEscolha,
} from './produto';

describe('deveUsarOpcoesLegado', () => {
  it('produto legado sem grupos continua exibindo as opções simples', () => {
    expect(deveUsarOpcoesLegado({ opcoes: ['Ao ponto', 'Bem passado'] })).toBe(true);
    expect(deveUsarOpcoesLegado({ opcoes: ['Ao ponto'], gruposOpcoes: [] })).toBe(true);
  });

  it('produto com pelo menos um grupo ativo NÃO exibe as opções simples, mesmo tendo opcoes cadastradas', () => {
    expect(
      deveUsarOpcoesLegado({
        opcoes: ['Ao ponto', 'Bem passado'],
        gruposOpcoes: [{ ativo: true }],
      }),
    ).toBe(false);
  });

  it('produto cujos grupos estão todos inativos volta a usar as opções simples', () => {
    expect(
      deveUsarOpcoesLegado({
        opcoes: ['Ao ponto', 'Bem passado'],
        gruposOpcoes: [{ ativo: false }, { ativo: false }],
      }),
    ).toBe(true);
  });

  it('produto sem opções legadas nunca usa o mecanismo legado, com ou sem grupos', () => {
    expect(deveUsarOpcoesLegado({ opcoes: null })).toBe(false);
    expect(deveUsarOpcoesLegado({ opcoes: [] })).toBe(false);
    expect(deveUsarOpcoesLegado({ opcoes: null, gruposOpcoes: [{ ativo: true }] })).toBe(false);
  });

  it('um único grupo ativo entre vários já basta pra desligar as opções simples', () => {
    expect(
      deveUsarOpcoesLegado({
        opcoes: ['Ao ponto'],
        gruposOpcoes: [{ ativo: false }, { ativo: true }, { ativo: false }],
      }),
    ).toBe(false);
  });
});

describe('produtoConfiguravel', () => {
  it('é falso quando opcoes é null e não há grupos', () => {
    expect(produtoConfiguravel({ opcoes: null })).toBe(false);
  });

  it('é falso quando opcoes é uma lista vazia', () => {
    expect(produtoConfiguravel({ opcoes: [] })).toBe(false);
  });

  it('é verdadeiro quando existe ao menos uma opção legada', () => {
    expect(produtoConfiguravel({ opcoes: ['Ao ponto', 'Bem passado'] })).toBe(true);
  });

  it('é verdadeiro quando existe ao menos um grupo de opções ativo', () => {
    expect(produtoConfiguravel({ opcoes: null, gruposOpcoes: [{ ativo: true }] })).toBe(true);
  });

  it('é falso quando todos os grupos de opções estão inativos', () => {
    expect(
      produtoConfiguravel({ opcoes: null, gruposOpcoes: [{ ativo: false }, { ativo: false }] }),
    ).toBe(false);
  });
});

describe('rotuloRegraEscolha', () => {
  it('"Escolha 1" quando min === max === 1', () => {
    expect(rotuloRegraEscolha({ minEscolhas: 1, maxEscolhas: 1 }, 3)).toBe('Escolha 1');
  });

  it('"Escolha até N" quando opcional mas com limite real menor que o total de opções', () => {
    expect(rotuloRegraEscolha({ minEscolhas: 0, maxEscolhas: 3 }, 5)).toBe('Escolha até 3');
  });

  it('"Escolha de X a Y" quando min e max diferem e ambos > 0', () => {
    expect(rotuloRegraEscolha({ minEscolhas: 1, maxEscolhas: 3 }, 5)).toBe('Escolha de 1 a 3');
  });

  it('"Opcional" quando min=0 e o máximo cobre todas as opções (sem limite real)', () => {
    expect(rotuloRegraEscolha({ minEscolhas: 0, maxEscolhas: 4 }, 4)).toBe('Opcional');
  });
});

describe('chaveItemCarrinho', () => {
  it('mesma configuração gera sempre a mesma chave, independente da ordem de seleção', () => {
    const a = chaveItemCarrinho(
      'p1',
      null,
      [{ grupoId: 'g1', opcoes: [{ id: 'o1' }, { id: 'o2' }] }],
      null,
    );
    const b = chaveItemCarrinho(
      'p1',
      null,
      [{ grupoId: 'g1', opcoes: [{ id: 'o2' }, { id: 'o1' }] }],
      null,
    );
    expect(a).toBe(b);
  });

  it('configurações diferentes geram chaves diferentes', () => {
    const a = chaveItemCarrinho('p1', null, [{ grupoId: 'g1', opcoes: [{ id: 'o1' }] }], null);
    const b = chaveItemCarrinho('p1', null, [{ grupoId: 'g1', opcoes: [{ id: 'o2' }] }], null);
    expect(a).not.toBe(b);
  });
});

describe('rotuloProdutoIncompleto', () => {
  it('é null quando tem foto e descrição', () => {
    expect(
      rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: 'Descrição ok' }),
    ).toBe(null);
  });

  it('sinaliza "Sem foto" quando só falta a foto', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: null, descricao: 'Descrição ok' })).toBe('Sem foto');
  });

  it('sinaliza "Sem descrição" quando só falta a descrição', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: null })).toBe(
      'Sem descrição',
    );
  });

  it('trata descrição vazia ou só com espaços como ausente', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: '' })).toBe(
      'Sem descrição',
    );
    expect(rotuloProdutoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: '   ' })).toBe(
      'Sem descrição',
    );
  });

  it('sinaliza "Sem foto e descrição" quando faltam os dois', () => {
    expect(rotuloProdutoIncompleto({ fotoUrl: null, descricao: null })).toBe(
      'Sem foto e descrição',
    );
  });
});

describe('agruparProdutosPorCategoria', () => {
  const categorias = [
    { id: 'cat-bebidas', nome: 'Bebidas' },
    { id: 'cat-lanches', nome: 'Lanches' },
  ];

  it('agrupa cada produto na categoria certa, respeitando a ordem das categorias', () => {
    const produtos = [
      { id: 'p1', categoriaId: 'cat-lanches', ordem: 0 },
      { id: 'p2', categoriaId: 'cat-bebidas', ordem: 0 },
    ];
    const grupos = agruparProdutosPorCategoria(categorias, produtos);
    expect(grupos.map((g) => g.categoria.id)).toEqual(['cat-bebidas', 'cat-lanches']);
    expect(grupos[0].produtos.map((p) => p.id)).toEqual(['p2']);
    expect(grupos[1].produtos.map((p) => p.id)).toEqual(['p1']);
  });

  it('ordena os produtos dentro de cada grupo pelo campo ordem', () => {
    const produtos = [
      { id: 'terceiro', categoriaId: 'cat-lanches', ordem: 2 },
      { id: 'primeiro', categoriaId: 'cat-lanches', ordem: 0 },
      { id: 'segundo', categoriaId: 'cat-lanches', ordem: 1 },
    ];
    const grupos = agruparProdutosPorCategoria(categorias, produtos);
    const lanches = grupos.find((g) => g.categoria.id === 'cat-lanches');
    expect(lanches?.produtos.map((p) => p.id)).toEqual(['primeiro', 'segundo', 'terceiro']);
  });

  it('categoria sem produtos gera grupo com lista vazia', () => {
    const grupos = agruparProdutosPorCategoria(categorias, []);
    expect(grupos.every((g) => g.produtos.length === 0)).toBe(true);
  });

  it('produto cuja categoria não existe mais na lista simplesmente não aparece', () => {
    const produtos = [{ id: 'orfao', categoriaId: 'cat-inexistente', ordem: 0 }];
    const grupos = agruparProdutosPorCategoria(categorias, produtos);
    const totalProdutos = grupos.reduce((soma, g) => soma + g.produtos.length, 0);
    expect(totalProdutos).toBe(0);
  });
});
