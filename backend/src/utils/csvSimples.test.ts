import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from './csvSimples';

test('parseia CSV simples separado por vírgula', () => {
  const linhas = parseCsv('categoria,produto,preco\nEspetinhos,Espetinho de Carne,8.00');
  assert.deepEqual(linhas, [
    { categoria: 'Espetinhos', produto: 'Espetinho de Carne', preco: '8.00' },
  ]);
});

test('detecta e usa ponto-e-vírgula quando é o delimitador predominante (Excel pt-BR)', () => {
  const linhas = parseCsv('categoria;produto;preco\nBebidas;Suco;6,00');
  assert.deepEqual(linhas, [{ categoria: 'Bebidas', produto: 'Suco', preco: '6,00' }]);
});

test('respeita campos entre aspas contendo o próprio delimitador', () => {
  const linhas = parseCsv('produto,descricao\n"Combo, casal","2 espetos, 1 refri"');
  assert.deepEqual(linhas, [{ produto: 'Combo, casal', descricao: '2 espetos, 1 refri' }]);
});

test('aspas duplas escapadas dentro de um campo entre aspas', () => {
  const linhas = parseCsv('produto\n"Batata ""palito"""');
  assert.deepEqual(linhas, [{ produto: 'Batata "palito"' }]);
});

test('ignora linhas totalmente vazias', () => {
  const linhas = parseCsv('produto,preco\nA,1\n\nB,2\n');
  assert.equal(linhas.length, 2);
});

test('csv vazio retorna lista vazia', () => {
  assert.deepEqual(parseCsv(''), []);
});
