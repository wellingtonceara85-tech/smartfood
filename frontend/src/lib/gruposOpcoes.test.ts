import { describe, expect, it } from 'vitest';
import {
  corpoProdutoComGrupos,
  GrupoEditavel,
  gruposParaPayload,
  validarGrupos,
} from './gruposOpcoes';

function opcao(nome: string, precoAdicional = '0', ativo = true): GrupoEditavel['opcoes'][number] {
  return { id: `op-${nome}`, nome, precoAdicional, ativo };
}

function grupo(overrides: Partial<GrupoEditavel> = {}): GrupoEditavel {
  return {
    id: 'g1',
    nome: 'Proteínas',
    minEscolhas: 1,
    maxEscolhas: 1,
    obrigatorio: true,
    ativo: true,
    opcoes: [opcao('Frango')],
    ...overrides,
  };
}

describe('validarGrupos — fluxo de criação de produto (rascunho antes de salvar)', () => {
  it('rascunho vazio (produto sem nenhum grupo configurado) é válido', () => {
    expect(validarGrupos([])).toBeNull();
  });

  it('grupo bem formado, com opções, é válido', () => {
    expect(validarGrupos([grupo()])).toBeNull();
  });

  it('bloqueia grupo sem nome', () => {
    expect(validarGrupos([grupo({ nome: '  ' })])).toMatch(/precisa de um nome/);
  });

  it('bloqueia escolha máxima menor que 1', () => {
    expect(validarGrupos([grupo({ maxEscolhas: 0 })])).toMatch(/pelo menos 1/);
  });

  it('bloqueia escolha mínima maior que a máxima', () => {
    expect(validarGrupos([grupo({ minEscolhas: 3, maxEscolhas: 2 })])).toMatch(
      /não pode ser maior que a máxima/,
    );
  });

  it('bloqueia opção sem nome dentro de um grupo válido', () => {
    expect(validarGrupos([grupo({ opcoes: [opcao('  ')] })])).toMatch(/toda opção precisa/);
  });

  it('bloqueia valor adicional não numérico', () => {
    expect(validarGrupos([grupo({ opcoes: [opcao('Bacon', 'abc')] })])).toMatch(
      /valor adicional inválido/,
    );
  });

  it('aceita valor adicional com vírgula decimal (formato brasileiro)', () => {
    expect(validarGrupos([grupo({ opcoes: [opcao('Bacon', '3,50')] })])).toBeNull();
  });

  it('valida cada grupo do rascunho — o segundo grupo inválido também é pego', () => {
    const gruposRascunho = [grupo(), grupo({ id: 'g2', nome: 'Adicionais', maxEscolhas: -1 })];
    expect(validarGrupos(gruposRascunho)).toMatch(/pelo menos 1/);
  });
});

describe('gruposParaPayload — conversão do rascunho local pro formato da API', () => {
  it('produto criado sem nenhum grupo configurado gera payload com lista vazia', () => {
    expect(gruposParaPayload([])).toEqual({ grupos: [] });
  });

  it('converte preço em texto (vírgula) pra número, e aplica trim nos nomes', () => {
    const payload = gruposParaPayload([
      grupo({
        nome: '  Proteínas  ',
        opcoes: [opcao('  Bacon  ', '3,50'), opcao('Ovo', '')],
      }),
    ]);
    expect(payload.grupos[0].nome).toBe('Proteínas');
    expect(payload.grupos[0].opcoes[0]).toMatchObject({ nome: 'Bacon', precoAdicional: 3.5 });
    // Campo vazio (usuário apagou o "0") nunca vira NaN no payload enviado —
    // cai pra 0, nunca bloqueia a criação por um detalhe de formatação.
    expect(payload.grupos[0].opcoes[1]).toMatchObject({ nome: 'Ovo', precoAdicional: 0 });
  });

  it('atribui `ordem` sequencial a grupos e opções, na ordem em que aparecem no rascunho', () => {
    const payload = gruposParaPayload([
      grupo({ id: 'g1', nome: 'Proteínas', opcoes: [opcao('Frango'), opcao('Carne')] }),
      grupo({ id: 'g2', nome: 'Adicionais', opcoes: [opcao('Bacon')] }),
    ]);
    expect(payload.grupos.map((g) => g.ordem)).toEqual([0, 1]);
    expect(payload.grupos[0].opcoes.map((o) => o.ordem)).toEqual([0, 1]);
  });

  it('preserva ativo/obrigatorio/minEscolhas/maxEscolhas de cada grupo e opção', () => {
    const payload = gruposParaPayload([
      grupo({
        obrigatorio: false,
        ativo: false,
        minEscolhas: 0,
        maxEscolhas: 3,
        opcoes: [opcao('Bacon', '2', false)],
      }),
    ]);
    expect(payload.grupos[0]).toMatchObject({
      obrigatorio: false,
      ativo: false,
      minEscolhas: 0,
      maxEscolhas: 3,
    });
    expect(payload.grupos[0].opcoes[0]).toMatchObject({ ativo: false, precoAdicional: 2 });
  });
});

describe('corpoProdutoComGrupos — reprodução do bug relatado na homologação', () => {
  // Cenário exato: grupo "Deseja retirar algum ingrediente?" com
  // "Quantas opções o cliente pode escolher?" em 5, editado pra 4, e
  // "Salvar" clicado (o botão principal do formulário de produto — não o
  // botão isolado "Salvar grupos de opções"). Antes da correção, o corpo
  // dessa chamada não incluía `grupos` nenhum, e a edição era descartada.
  const corpoBasico = { nome: 'Hambúrguer', preco: 12.9, categoriaId: 'cat-1' };

  it('o corpo enviado ao salvar SEMPRE inclui os grupos atuais, mesmo editando um produto existente', () => {
    const grupoEditado = grupo({
      nome: 'Deseja retirar algum ingrediente?',
      minEscolhas: 1,
      maxEscolhas: 4, // era 5, editado pra 4
      opcoes: [opcao('Alface'), opcao('Tomate'), opcao('Cebola'), opcao('Picles')],
    });
    const corpo = corpoProdutoComGrupos(corpoBasico, [grupoEditado]);
    expect(corpo).toMatchObject(corpoBasico);
    expect(corpo.grupos).toHaveLength(1);
    expect(corpo.grupos[0].maxEscolhas).toBe(4);
  });

  it('as 6 edições do cenário relatado (nome, min, max, obrigatorio, ativo, preço adicional) chegam todas no corpo final', () => {
    const grupoEditado = grupo({
      nome: 'Retirar ingrediente',
      minEscolhas: 0,
      maxEscolhas: 4,
      obrigatorio: true,
      ativo: false,
      opcoes: [opcao('Bacon', '3,50')],
    });
    const corpo = corpoProdutoComGrupos(corpoBasico, [grupoEditado]);
    expect(corpo.grupos[0]).toMatchObject({
      nome: 'Retirar ingrediente',
      minEscolhas: 0,
      maxEscolhas: 4,
      obrigatorio: true,
      ativo: false,
    });
    expect(corpo.grupos[0].opcoes[0]).toMatchObject({ nome: 'Bacon', precoAdicional: 3.5 });
  });

  it('produto sem nenhum grupo configurado gera corpo com `grupos: []`, nunca omitido', () => {
    const corpo = corpoProdutoComGrupos(corpoBasico, []);
    expect(corpo.grupos).toEqual([]);
  });
});
