import { describe, expect, it } from 'vitest';
import { PapelNome } from '../../domain/papel';
import {
  EmailInvalidoError,
  NomeObrigatorioError,
  PapelInvalidoError,
  SenhaObrigatoriaError,
  Usuario,
} from '../../domain/usuario.entity';

const dadosValidos = {
  empresaId: 'empresa-1',
  nome: 'Wellington',
  email: 'wellington@smartfood.com.br',
  senhaHash: 'hash-fake',
  papel: PapelNome.ADMINISTRADOR,
};

describe('Usuario', () => {
  it('cria um Usuário válido, com e-mail normalizado em minúsculas', () => {
    const usuario = Usuario.criar({ ...dadosValidos, email: 'Wellington@SmartFood.com.br' });
    expect(usuario.paraPersistencia().email).toBe('wellington@smartfood.com.br');
  });

  it('exige nome', () => {
    expect(() => Usuario.criar({ ...dadosValidos, nome: '  ' })).toThrow(NomeObrigatorioError);
  });

  it('exige e-mail válido', () => {
    expect(() => Usuario.criar({ ...dadosValidos, email: 'nao-e-email' })).toThrow(
      EmailInvalidoError,
    );
  });

  it('exige senha (já hasheada)', () => {
    expect(() => Usuario.criar({ ...dadosValidos, senhaHash: '' })).toThrow(SenhaObrigatoriaError);
  });

  it('exige um Papel interno válido', () => {
    expect(() => Usuario.criar({ ...dadosValidos, papel: 'Cliente' })).toThrow(PapelInvalidoError);
  });

  it('reconstitui um Usuário existente sem repetir validação de criação', () => {
    const usuario = Usuario.reconstituir({
      id: 'usuario-1',
      empresaId: 'empresa-1',
      nome: 'Wellington',
      email: 'wellington@smartfood.com.br',
      senhaHash: 'hash-fake',
      papel: PapelNome.GERENTE,
      criadoEm: new Date('2026-01-01'),
    });

    expect(usuario.paraPersistencia().papel).toBe(PapelNome.GERENTE);
  });
});
