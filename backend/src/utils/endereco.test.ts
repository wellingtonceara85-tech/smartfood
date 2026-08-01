import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizarCep,
  normalizarTelefone,
  normalizarUf,
  validarEnderecoEntrega,
} from './endereco';

test('normalizarTelefone aceita formatos variados de celular/fixo brasileiro', () => {
  assert.equal(normalizarTelefone('85999404661'), '85999404661');
  assert.equal(normalizarTelefone('(85) 99940-4661'), '85999404661');
  assert.equal(normalizarTelefone('8533334444'), '8533334444');
  assert.equal(normalizarTelefone('5585999404661'), '85999404661'); // com DDI 55
});

test('normalizarTelefone rejeita números com dígitos insuficientes/excessivos', () => {
  assert.equal(normalizarTelefone('123456'), null);
  assert.equal(normalizarTelefone('123456789012345'), null);
  assert.equal(normalizarTelefone(''), null);
});

test('normalizarCep aceita com ou sem máscara e exige 8 dígitos', () => {
  assert.equal(normalizarCep('60000-000'), '60000000');
  assert.equal(normalizarCep('60000000'), '60000000');
  assert.equal(normalizarCep('6000-00'), null);
  assert.equal(normalizarCep(''), null);
});

test('normalizarUf aceita minúsculas e rejeita UF inexistente', () => {
  assert.equal(normalizarUf('ce'), 'CE');
  assert.equal(normalizarUf('CE'), 'CE');
  assert.equal(normalizarUf('XX'), null);
  assert.equal(normalizarUf(''), null);
});

test('validarEnderecoEntrega aceita endereço completo e normaliza os campos', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000-000',
    logradouro: 'Rua Exemplo',
    numero: '123',
    complemento: 'Apto 201',
    bairro: 'Centro',
    cidade: 'Fortaleza',
    estado: 'ce',
    referencia: 'Próximo à praça',
  });
  assert.equal(resultado.valido, true);
  if (resultado.valido) {
    assert.deepEqual(resultado.endereco, {
      cep: '60000000',
      logradouro: 'Rua Exemplo',
      numero: '123',
      complemento: 'Apto 201',
      bairro: 'Centro',
      cidade: 'Fortaleza',
      estado: 'CE',
      referencia: 'Próximo à praça',
    });
  }
});

test('validarEnderecoEntrega aceita complemento/referência vazios como null', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000000',
    logradouro: 'Rua Exemplo',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Fortaleza',
    estado: 'CE',
  });
  assert.equal(resultado.valido, true);
  if (resultado.valido) {
    assert.equal(resultado.endereco.complemento, null);
    assert.equal(resultado.endereco.referencia, null);
  }
});

test('validarEnderecoEntrega rejeita quando falta CEP', () => {
  const resultado = validarEnderecoEntrega({
    logradouro: 'Rua Exemplo',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Fortaleza',
    estado: 'CE',
  });
  assert.equal(resultado.valido, false);
});

test('validarEnderecoEntrega rejeita quando falta rua', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000000',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Fortaleza',
    estado: 'CE',
  });
  assert.equal(resultado.valido, false);
});

test('validarEnderecoEntrega rejeita quando falta número', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000000',
    logradouro: 'Rua Exemplo',
    bairro: 'Centro',
    cidade: 'Fortaleza',
    estado: 'CE',
  });
  assert.equal(resultado.valido, false);
});

test('validarEnderecoEntrega rejeita quando falta bairro', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000000',
    logradouro: 'Rua Exemplo',
    numero: '123',
    cidade: 'Fortaleza',
    estado: 'CE',
  });
  assert.equal(resultado.valido, false);
});

test('validarEnderecoEntrega rejeita quando falta cidade', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000000',
    logradouro: 'Rua Exemplo',
    numero: '123',
    bairro: 'Centro',
    estado: 'CE',
  });
  assert.equal(resultado.valido, false);
});

test('validarEnderecoEntrega rejeita quando falta estado', () => {
  const resultado = validarEnderecoEntrega({
    cep: '60000000',
    logradouro: 'Rua Exemplo',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Fortaleza',
  });
  assert.equal(resultado.valido, false);
});

test('validarEnderecoEntrega rejeita endereço ausente (null/undefined)', () => {
  assert.equal(validarEnderecoEntrega(null).valido, false);
  assert.equal(validarEnderecoEntrega(undefined).valido, false);
});
