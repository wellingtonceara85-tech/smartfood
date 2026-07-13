import { describe, expect, it } from 'vitest';
import {
  CategoriaObrigatoriaError,
  NomeProdutoObrigatorioError,
  Produto,
  ProdutoSemVariacaoDisponivelError,
  VariacaoNaoEncontradaError,
} from '../../domain/produto.entity';
import { PrecoVariacaoInvalidoError } from '../../domain/variacao.entity';

const dadosValidos = {
  lojaId: 'loja-1',
  categoriaId: 'categoria-1',
  nome: 'Coca-Cola',
  primeiraVariacao: { nome: 'Lata 350ml', precoValor: 6.5 },
};

describe('Produto', () => {
  it('Invariante 1 — nasce sempre com pelo menos uma Variação', () => {
    const produto = Produto.criar(dadosValidos);
    expect(produto.paraPersistencia().variacoes).toHaveLength(1);
    expect(produto.paraPersistencia().variacoes[0].nome).toBe('Lata 350ml');
  });

  it('exige nome', () => {
    expect(() => Produto.criar({ ...dadosValidos, nome: '  ' })).toThrow(
      NomeProdutoObrigatorioError,
    );
  });

  it('exige categoria', () => {
    expect(() => Produto.criar({ ...dadosValidos, categoriaId: '' })).toThrow(
      CategoriaObrigatoriaError,
    );
  });

  it('rejeita a primeira Variação sem preço válido (delegado a Variacao.criar)', () => {
    expect(() =>
      Produto.criar({ ...dadosValidos, primeiraVariacao: { nome: 'Lata', precoValor: -1 } }),
    ).toThrow(PrecoVariacaoInvalidoError);
  });

  it('nasce disponível por padrão', () => {
    const produto = Produto.criar(dadosValidos);
    expect(produto.paraPersistencia().disponivel).toBe(true);
  });

  it('Invariante 2 — desliga a única Variação e o Produto fica indisponível junto', () => {
    const produto = Produto.criar(dadosValidos);
    const variacaoId = produto.paraPersistencia().variacoes[0].id;

    produto.alternarDisponibilidadeVariacao(variacaoId);

    expect(produto.paraPersistencia().variacoes[0].disponivel).toBe(false);
    expect(produto.paraPersistencia().disponivel).toBe(false);
  });

  it('Invariante 2 — rejeita ligar o Produto se nenhuma Variação estiver disponível', () => {
    const produto = Produto.criar(dadosValidos);
    const variacaoId = produto.paraPersistencia().variacoes[0].id;

    produto.alternarDisponibilidadeVariacao(variacaoId); // desliga a única Variação

    expect(() => produto.ligarDisponibilidade()).toThrow(ProdutoSemVariacaoDisponivelError);
  });

  it('ligar uma Variação de volta NÃO reativa o Produto automaticamente (regra unidirecional)', () => {
    const produto = Produto.criar(dadosValidos);
    const variacaoId = produto.paraPersistencia().variacoes[0].id;

    produto.alternarDisponibilidadeVariacao(variacaoId); // desliga → Produto fica indisponível
    produto.alternarDisponibilidadeVariacao(variacaoId); // liga de novo

    expect(produto.paraPersistencia().variacoes[0].disponivel).toBe(true);
    expect(produto.paraPersistencia().disponivel).toBe(false); // continua indisponível
  });

  it('rejeita alternar uma Variação que não existe neste Produto', () => {
    const produto = Produto.criar(dadosValidos);
    expect(() => produto.alternarDisponibilidadeVariacao('id-invalido')).toThrow(
      VariacaoNaoEncontradaError,
    );
  });

  it('alternarDisponibilidade alterna entre ligado e desligado', () => {
    const produto = Produto.criar(dadosValidos);
    expect(produto.paraPersistencia().disponivel).toBe(true);

    produto.alternarDisponibilidade();
    expect(produto.paraPersistencia().disponivel).toBe(false);

    produto.alternarDisponibilidade();
    expect(produto.paraPersistencia().disponivel).toBe(true);
  });
});
