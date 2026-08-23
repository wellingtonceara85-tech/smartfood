const RAIO_TERRA_METROS = 6_371_000;

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

export function latitudeValida(valor: number): boolean {
  return Number.isFinite(valor) && valor >= -90 && valor <= 90;
}

export function longitudeValida(valor: number): boolean {
  return Number.isFinite(valor) && valor >= -180 && valor <= 180;
}

export function coordenadaValida(latitude: number, longitude: number): boolean {
  return latitudeValida(latitude) && longitudeValida(longitude);
}

/**
 * Distância aproximada em linha reta (Haversine), em metros — mesma fórmula
 * usada no backend (backend/src/utils/distancia.ts). Usada só pra estimativa
 * imediata no checkout; a taxa que vale de verdade é sempre recalculada pelo
 * backend na criação do pedido.
 */
export function distanciaAproximadaMetros(
  latitudeOrigem: number,
  longitudeOrigem: number,
  latitudeDestino: number,
  longitudeDestino: number,
): number {
  const deltaLat = paraRadianos(latitudeDestino - latitudeOrigem);
  const deltaLng = paraRadianos(longitudeDestino - longitudeOrigem);
  const latOrigemRad = paraRadianos(latitudeOrigem);
  const latDestinoRad = paraRadianos(latitudeDestino);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latOrigemRad) * Math.cos(latDestinoRad) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RAIO_TERRA_METROS * c;
}

export interface FaixaEntrega {
  distanciaMaxMetros: number;
  valorEntrega: number;
}

export type ResultadoFaixaEntrega =
  | { ok: true; valorEntrega: number; distanciaMaxMetros: number }
  | { ok: false; motivo: 'fora_de_cobertura' };

/** Mesmo critério de limite inclusivo do backend — ver resolverTaxaPorDistancia lá. */
export function resolverTaxaPorDistancia(
  faixas: FaixaEntrega[],
  distanciaMetros: number,
): ResultadoFaixaEntrega {
  const ordenadas = [...faixas].sort((a, b) => a.distanciaMaxMetros - b.distanciaMaxMetros);
  const faixa = ordenadas.find((f) => distanciaMetros <= f.distanciaMaxMetros);
  if (!faixa) return { ok: false, motivo: 'fora_de_cobertura' };
  return {
    ok: true,
    valorEntrega: faixa.valorEntrega,
    distanciaMaxMetros: faixa.distanciaMaxMetros,
  };
}

/**
 * Formata a distância aproximada pro cliente ver no checkout: metros pra
 * valores pequenos (ex: "420 m"), km com 1 casa decimal pra valores maiores
 * (ex: "1,3 km") — troca em 1000m.
 */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

export type ResultadoValidacaoFaixas = { valido: true } | { valido: false; erro: string };

/** Mesma regra do backend — usada só pra feedback imediato no formulário do painel. */
export function validarFaixasEntrega(faixas: FaixaEntrega[]): ResultadoValidacaoFaixas {
  if (faixas.length === 0) {
    return { valido: false, erro: 'Cadastre pelo menos uma faixa de distância' };
  }

  for (const faixa of faixas) {
    if (!Number.isFinite(faixa.distanciaMaxMetros) || faixa.distanciaMaxMetros <= 0) {
      return { valido: false, erro: 'A distância de cada faixa precisa ser maior que zero' };
    }
    if (!Number.isFinite(faixa.valorEntrega) || faixa.valorEntrega < 0) {
      return { valido: false, erro: 'O valor de cada faixa não pode ser negativo' };
    }
  }

  const ordenadas = [...faixas].sort((a, b) => a.distanciaMaxMetros - b.distanciaMaxMetros);
  for (let i = 1; i < ordenadas.length; i += 1) {
    if (ordenadas[i].distanciaMaxMetros <= ordenadas[i - 1].distanciaMaxMetros) {
      return {
        valido: false,
        erro: 'As faixas precisam ter distâncias diferentes e crescentes',
      };
    }
  }

  return { valido: true };
}
