import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  coordenadaValida,
  distanciaAproximadaMetros,
  resolverTaxaPorDistancia,
  validarFaixasEntrega,
} from './distancia';

// Faixas de exemplo da própria missão: até 500m grátis, 501m-2km R$3, 2,01-5km R$5.
const FAIXAS_EXEMPLO = [
  { distanciaMaxMetros: 500, valorEntrega: 0 },
  { distanciaMaxMetros: 2000, valorEntrega: 3 },
  { distanciaMaxMetros: 5000, valorEntrega: 5 },
];

test('distanciaAproximadaMetros: mesma coordenada é distância zero', () => {
  assert.equal(distanciaAproximadaMetros(-3.7327, -38.527, -3.7327, -38.527), 0);
});

test('distanciaAproximadaMetros: 1 grau de latitude é ~111km', () => {
  const distancia = distanciaAproximadaMetros(0, 0, 1, 0);
  assert.ok(distancia > 110_000 && distancia < 112_000, `esperado ~111km, obtido ${distancia}`);
});

test('coordenadaValida: aceita limites e rejeita fora de faixa', () => {
  assert.equal(coordenadaValida(90, 180), true);
  assert.equal(coordenadaValida(-90, -180), true);
  assert.equal(coordenadaValida(90.1, 0), false);
  assert.equal(coordenadaValida(0, 180.1), false);
  assert.equal(coordenadaValida(Number.NaN, 0), false);
});

test('resolverTaxaPorDistancia: fronteiras exatas da faixa grátis', () => {
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 0), {
    ok: true,
    valorEntrega: 0,
    distanciaMaxMetros: 500,
  });
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 499), {
    ok: true,
    valorEntrega: 0,
    distanciaMaxMetros: 500,
  });
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 500), {
    ok: true,
    valorEntrega: 0,
    distanciaMaxMetros: 500,
  });
});

test('resolverTaxaPorDistancia: 501m já cai na próxima faixa (paga)', () => {
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 501), {
    ok: true,
    valorEntrega: 3,
    distanciaMaxMetros: 2000,
  });
});

test('resolverTaxaPorDistancia: limite exato de 2km ainda é a faixa de R$3', () => {
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 2000), {
    ok: true,
    valorEntrega: 3,
    distanciaMaxMetros: 2000,
  });
});

test('resolverTaxaPorDistancia: imediatamente acima de 2km cai na faixa de R$5', () => {
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 2001), {
    ok: true,
    valorEntrega: 5,
    distanciaMaxMetros: 5000,
  });
});

test('resolverTaxaPorDistancia: limite máximo cadastrado ainda cobre', () => {
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 5000), {
    ok: true,
    valorEntrega: 5,
    distanciaMaxMetros: 5000,
  });
});

test('resolverTaxaPorDistancia: acima do limite máximo é fora de cobertura', () => {
  assert.deepEqual(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 5001), {
    ok: false,
    motivo: 'fora_de_cobertura',
  });
});

test('resolverTaxaPorDistancia: faixas desordenadas na entrada não afetam o resultado', () => {
  const desordenadas = [...FAIXAS_EXEMPLO].reverse();
  assert.deepEqual(resolverTaxaPorDistancia(desordenadas, 501), {
    ok: true,
    valorEntrega: 3,
    distanciaMaxMetros: 2000,
  });
});

test('validarFaixasEntrega: configuração válida', () => {
  assert.deepEqual(validarFaixasEntrega(FAIXAS_EXEMPLO), { valido: true });
});

test('validarFaixasEntrega: lista vazia é inválida', () => {
  const resultado = validarFaixasEntrega([]);
  assert.equal(resultado.valido, false);
});

test('validarFaixasEntrega: ordem de entrada não importa, só os valores distintos', () => {
  const resultado = validarFaixasEntrega([
    { distanciaMaxMetros: 2000, valorEntrega: 3 },
    { distanciaMaxMetros: 500, valorEntrega: 0 },
  ]);
  assert.equal(resultado.valido, true);
});

test('validarFaixasEntrega: distâncias duplicadas são inválidas', () => {
  const resultado = validarFaixasEntrega([
    { distanciaMaxMetros: 500, valorEntrega: 0 },
    { distanciaMaxMetros: 500, valorEntrega: 3 },
  ]);
  assert.equal(resultado.valido, false);
});

test('validarFaixasEntrega: distância zero ou negativa é inválida', () => {
  assert.equal(validarFaixasEntrega([{ distanciaMaxMetros: 0, valorEntrega: 0 }]).valido, false);
  assert.equal(validarFaixasEntrega([{ distanciaMaxMetros: -1, valorEntrega: 0 }]).valido, false);
});

test('validarFaixasEntrega: valor negativo é inválido', () => {
  const resultado = validarFaixasEntrega([{ distanciaMaxMetros: 500, valorEntrega: -1 }]);
  assert.equal(resultado.valido, false);
});
