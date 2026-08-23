import { describe, expect, it } from 'vitest';
import {
  coordenadaValida,
  distanciaAproximadaMetros,
  resolverTaxaPorDistancia,
  validarFaixasEntrega,
} from './distancia';

const FAIXAS_EXEMPLO = [
  { distanciaMaxMetros: 500, valorEntrega: 0 },
  { distanciaMaxMetros: 2000, valorEntrega: 3 },
  { distanciaMaxMetros: 5000, valorEntrega: 5 },
];

describe('distanciaAproximadaMetros', () => {
  it('mesma coordenada é distância zero', () => {
    expect(distanciaAproximadaMetros(-3.7327, -38.527, -3.7327, -38.527)).toBe(0);
  });

  it('1 grau de latitude é ~111km', () => {
    const distancia = distanciaAproximadaMetros(0, 0, 1, 0);
    expect(distancia).toBeGreaterThan(110_000);
    expect(distancia).toBeLessThan(112_000);
  });
});

describe('coordenadaValida', () => {
  it('aceita limites e rejeita fora de faixa', () => {
    expect(coordenadaValida(90, 180)).toBe(true);
    expect(coordenadaValida(-90, -180)).toBe(true);
    expect(coordenadaValida(90.1, 0)).toBe(false);
    expect(coordenadaValida(0, 180.1)).toBe(false);
  });
});

describe('resolverTaxaPorDistancia', () => {
  it('fronteiras exatas da faixa grátis (0, 499, 500)', () => {
    expect(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 0)).toEqual({
      ok: true,
      valorEntrega: 0,
      distanciaMaxMetros: 500,
    });
    expect(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 499)).toEqual({
      ok: true,
      valorEntrega: 0,
      distanciaMaxMetros: 500,
    });
    expect(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 500)).toEqual({
      ok: true,
      valorEntrega: 0,
      distanciaMaxMetros: 500,
    });
  });

  it('501m cai na faixa paga seguinte', () => {
    expect(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 501)).toEqual({
      ok: true,
      valorEntrega: 3,
      distanciaMaxMetros: 2000,
    });
  });

  it('limite máximo cadastrado ainda cobre, acima disso é fora de cobertura', () => {
    expect(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 5000)).toEqual({
      ok: true,
      valorEntrega: 5,
      distanciaMaxMetros: 5000,
    });
    expect(resolverTaxaPorDistancia(FAIXAS_EXEMPLO, 5001)).toEqual({
      ok: false,
      motivo: 'fora_de_cobertura',
    });
  });
});

describe('validarFaixasEntrega', () => {
  it('aceita configuração válida', () => {
    expect(validarFaixasEntrega(FAIXAS_EXEMPLO)).toEqual({ valido: true });
  });

  it('rejeita lista vazia, distâncias duplicadas ou valores inválidos', () => {
    expect(validarFaixasEntrega([]).valido).toBe(false);
    expect(
      validarFaixasEntrega([
        { distanciaMaxMetros: 500, valorEntrega: 0 },
        { distanciaMaxMetros: 500, valorEntrega: 3 },
      ]).valido,
    ).toBe(false);
    expect(validarFaixasEntrega([{ distanciaMaxMetros: 0, valorEntrega: 0 }]).valido).toBe(false);
    expect(validarFaixasEntrega([{ distanciaMaxMetros: 500, valorEntrega: -1 }]).valido).toBe(
      false,
    );
  });

  it('ordem de entrada não importa, só os valores distintos', () => {
    expect(
      validarFaixasEntrega([
        { distanciaMaxMetros: 2000, valorEntrega: 3 },
        { distanciaMaxMetros: 500, valorEntrega: 0 },
      ]).valido,
    ).toBe(true);
  });
});
