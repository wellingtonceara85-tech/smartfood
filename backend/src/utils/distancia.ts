const RAIO_TERRA_METROS = 6_371_000;

function paraRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

/** Latitude válida: -90..90. */
export function latitudeValida(valor: number): boolean {
  return Number.isFinite(valor) && valor >= -90 && valor <= 90;
}

/** Longitude válida: -180..180. */
export function longitudeValida(valor: number): boolean {
  return Number.isFinite(valor) && valor >= -180 && valor <= 180;
}

export function coordenadaValida(latitude: number, longitude: number): boolean {
  return latitudeValida(latitude) && longitudeValida(longitude);
}

/**
 * Distância aproximada em linha reta (fórmula de Haversine), em metros.
 * NÃO é distância de rota real percorrida pela rua — não existe engine de
 * rotas nesta versão. Usada só como estimativa pra resolver a faixa de
 * entrega configurada pela loja.
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

/**
 * Resolve qual faixa cobre a distância informada. Faixas são degraus com
 * limite superior inclusivo (ex: "até 500m" cobre exatamente 500m; 501m já
 * cai na próxima) — mesmo critério dos exemplos da missão. `faixas` não
 * precisa estar ordenada: a função ordena por distanciaMaxMetros antes de
 * resolver.
 */
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

export type ResultadoValidacaoFaixas = { valido: true } | { valido: false; erro: string };

/**
 * Valida a configuração de faixas do lojista antes de salvar: cada faixa
 * precisa de um limite positivo e valor não-negativo, e os limites precisam
 * ser estritamente crescentes e sem repetição — senão duas faixas disputariam
 * a mesma distância de forma ambígua.
 */
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
