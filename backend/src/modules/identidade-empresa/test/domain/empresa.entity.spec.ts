import { describe, expect, it } from 'vitest';
import {
  CategoriaNegocioObrigatoriaError,
  CnpjCpfObrigatorioError,
  Empresa,
  NomeObrigatorioError,
  TelefoneObrigatorioError,
} from '../../domain/empresa.entity';

const dadosValidos = {
  nome: 'Pizzaria do Wellington',
  cnpjCpf: '12345678000199',
  categoriaNegocio: 'Pizzaria',
  telefone: '11999999999',
};

describe('Empresa', () => {
  it('nasce sempre com uma Loja padrão vinculada a ela (invariante, Missão 0006)', () => {
    const { empresa, lojaPadrao } = Empresa.criar(dadosValidos);

    expect(lojaPadrao.paraPersistencia().empresaId).toBe(empresa.paraPersistencia().id);
    expect(lojaPadrao.paraPersistencia().nome).toBe(dadosValidos.nome);
  });

  it('exige nome', () => {
    expect(() => Empresa.criar({ ...dadosValidos, nome: '  ' })).toThrow(NomeObrigatorioError);
  });

  it('exige CNPJ/CPF', () => {
    expect(() => Empresa.criar({ ...dadosValidos, cnpjCpf: '' })).toThrow(CnpjCpfObrigatorioError);
  });

  it('exige categoria de negócio', () => {
    expect(() => Empresa.criar({ ...dadosValidos, categoriaNegocio: '' })).toThrow(
      CategoriaNegocioObrigatoriaError,
    );
  });

  it('exige telefone', () => {
    expect(() => Empresa.criar({ ...dadosValidos, telefone: '' })).toThrow(
      TelefoneObrigatorioError,
    );
  });

  it('a Empresa nasce sem Chave PIX (fora de escopo desta missão)', () => {
    const { empresa } = Empresa.criar(dadosValidos);
    expect(empresa.paraPersistencia().chavePix).toBeNull();
  });
});
