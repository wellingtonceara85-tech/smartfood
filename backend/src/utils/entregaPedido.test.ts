import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularTaxaEntregaPorDistancia } from './entregaPedido';

const LOJA_ORIGEM = { latitude: -3.7327, longitude: -38.527 };
const FAIXAS = [
  { distanciaMaxMetros: 500, valorEntrega: 0 },
  { distanciaMaxMetros: 2000, valorEntrega: 3 },
];

test('loja sem latitude/longitude configuradas retorna erro (nunca inventa taxa)', () => {
  const resultado = calcularTaxaEntregaPorDistancia({ latitude: null, longitude: null }, FAIXAS, {
    latitude: -3.7327,
    longitude: -38.527,
  });
  assert.equal(resultado.ok, false);
});

test('cliente sem localização retorna erro', () => {
  const resultado = calcularTaxaEntregaPorDistancia(LOJA_ORIGEM, FAIXAS, null);
  assert.equal(resultado.ok, false);
});

test('coordenadas do cliente fora dos limites válidos retornam erro', () => {
  const resultado = calcularTaxaEntregaPorDistancia(LOJA_ORIGEM, FAIXAS, {
    latitude: 200,
    longitude: -38.527,
  });
  assert.equal(resultado.ok, false);
});

test('cliente muito próximo da loja cai na faixa grátis', () => {
  const resultado = calcularTaxaEntregaPorDistancia(LOJA_ORIGEM, FAIXAS, {
    latitude: -3.7327,
    longitude: -38.527,
  });
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.valorEntrega, 0);
    assert.equal(resultado.distanciaMetros, 0);
  }
});

test('cliente fora de todas as faixas retorna erro de fora de cobertura', () => {
  // ~1 grau de latitude de distância (~111km) — bem além das faixas cadastradas.
  const resultado = calcularTaxaEntregaPorDistancia(LOJA_ORIGEM, FAIXAS, {
    latitude: LOJA_ORIGEM.latitude + 1,
    longitude: LOJA_ORIGEM.longitude,
  });
  assert.equal(resultado.ok, false);
  if (!resultado.ok) {
    assert.match(resultado.erro, /fora da área/);
  }
});

test('resultado ok inclui a distância e as coordenadas usadas, para persistir no pedido', () => {
  const resultado = calcularTaxaEntregaPorDistancia(LOJA_ORIGEM, FAIXAS, {
    latitude: -3.7327,
    longitude: -38.527,
  });
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.equal(resultado.clienteLatitude, -3.7327);
    assert.equal(resultado.clienteLongitude, -38.527);
  }
});
