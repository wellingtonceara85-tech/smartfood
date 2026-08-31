import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTextoCardapio } from './parserTextoCardapio';

test('extrai nome e preço do exemplo do PRD', () => {
  const texto = [
    'Espetinho de Carne - 8,00',
    'Espetinho de Frango - 7,00',
    'Espetinho de Queijo - 8,00',
    'Refrigerante lata - 5,00',
  ].join('\n');

  const itens = parseTextoCardapio(texto);
  assert.equal(itens.length, 4);
  assert.deepEqual(
    itens.map((i) => [i.nome, i.preco, i.precisaRevisao]),
    [
      ['Espetinho de Carne', 8, false],
      ['Espetinho de Frango', 7, false],
      ['Espetinho de Queijo', 8, false],
      ['Refrigerante lata', 5, false],
    ],
  );
});

test('ignora linhas vazias', () => {
  const itens = parseTextoCardapio('Água - 3,00\n\n\nSuco - 6,00\n');
  assert.equal(itens.length, 2);
});

test('linha sem preço reconhecível vira item precisando de revisão, sem preço inventado', () => {
  const itens = parseTextoCardapio('Pão na chapa\nCoxinha - 5,00');
  assert.equal(itens[0].nome, 'Pão na chapa');
  assert.equal(itens[0].preco, null);
  assert.equal(itens[0].precisaRevisao, true);
  assert.deepEqual(itens[0].motivosRevisao, ['sem_preco']);
  assert.equal(itens[1].precisaRevisao, false);
});

test('linha que é só um número (sem nome reconhecível) não inventa nome vazio', () => {
  const itens = parseTextoCardapio('8,00');
  assert.equal(itens[0].precisaRevisao, true);
  assert.equal(itens[0].nome, '8,00');
  assert.equal(itens[0].preco, null);
});

test('aceita "R$" e preço sem casas decimais no final da linha', () => {
  const itens = parseTextoCardapio('Suco natural - R$ 7\nÁgua com gás: 4');
  assert.equal(itens[0].preco, 7);
  assert.equal(itens[1].preco, 4);
});

test('quando a linha tem "nome - descrição - preço", separa descrição do preço', () => {
  const itens = parseTextoCardapio('Combo casal - 2 espetos + refri - 25,00');
  assert.equal(itens[0].nome, 'Combo casal');
  assert.equal(itens[0].descricao, '2 espetos + refri');
  assert.equal(itens[0].preco, 25);
});

test('preço em formato ambíguo/não numérico marca precisaRevisao com o texto bruto preservado', () => {
  const itens = parseTextoCardapio('Prato executivo - a combinar');
  assert.equal(itens[0].precisaRevisao, true);
  assert.equal(itens[0].nome, 'Prato executivo');
});
