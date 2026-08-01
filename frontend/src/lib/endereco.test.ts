import { describe, expect, it } from 'vitest';
import {
  cepValido,
  formatarEnderecoCompleto,
  formatarEnderecoResumo,
  maskCep,
  maskTelefone,
  telefoneValido,
  UFS_BRASIL,
} from './endereco';

describe('maskCep', () => {
  it('formata progressivamente enquanto digita', () => {
    expect(maskCep('6')).toBe('6');
    expect(maskCep('60000')).toBe('60000');
    expect(maskCep('60000000')).toBe('60000-000');
  });

  it('ignora caracteres não numéricos e limita a 8 dígitos', () => {
    expect(maskCep('60.000-000extra')).toBe('60000-000');
  });
});

describe('maskTelefone', () => {
  it('formata celular (11 dígitos)', () => {
    expect(maskTelefone('85999404661')).toBe('(85) 99940-4661');
  });

  it('formata fixo (10 dígitos)', () => {
    expect(maskTelefone('8533334444')).toBe('(85) 3333-4444');
  });

  it('formata progressivamente enquanto digita', () => {
    expect(maskTelefone('8')).toBe('8');
    expect(maskTelefone('85')).toBe('85');
    expect(maskTelefone('8599')).toBe('(85) 99');
  });
});

describe('cepValido / telefoneValido', () => {
  it('cepValido exige 8 dígitos', () => {
    expect(cepValido('60000-000')).toBe(true);
    expect(cepValido('6000-000')).toBe(false);
  });

  it('telefoneValido aceita 10 ou 11 dígitos', () => {
    expect(telefoneValido('(85) 99940-4661')).toBe(true);
    expect(telefoneValido('(85) 3333-4444')).toBe(true);
    expect(telefoneValido('123456')).toBe(false);
  });
});

it('UFS_BRASIL tem as 27 unidades federativas', () => {
  expect(UFS_BRASIL.length).toBe(27);
  expect(UFS_BRASIL).toContain('CE');
});

describe('formatarEnderecoResumo', () => {
  it('monta uma linha com rua, número, bairro e cidade/UF', () => {
    const resumo = formatarEnderecoResumo({
      logradouro: 'Rua Exemplo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'CE',
    });
    expect(resumo).toBe('Rua Exemplo, 123 — Centro — Fortaleza/CE');
  });
});

describe('formatarEnderecoCompleto', () => {
  it('inclui complemento e referência quando presentes', () => {
    const linhas = formatarEnderecoCompleto({
      cep: '60000000',
      logradouro: 'Rua Exemplo',
      numero: '123',
      complemento: 'Apto 201',
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'CE',
      referencia: 'Próximo à praça',
    });
    expect(linhas).toEqual([
      'Rua Exemplo, 123',
      'Apto 201',
      'Centro',
      'Fortaleza/CE',
      'CEP: 60000-000',
      'Referência: Próximo à praça',
    ]);
  });

  it('omite complemento e referência quando ausentes', () => {
    const linhas = formatarEnderecoCompleto({
      cep: '60000000',
      logradouro: 'Rua Exemplo',
      numero: '123',
      complemento: null,
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'CE',
      referencia: null,
    });
    expect(linhas).toEqual(['Rua Exemplo, 123', 'Centro', 'Fortaleza/CE', 'CEP: 60000-000']);
  });
});
