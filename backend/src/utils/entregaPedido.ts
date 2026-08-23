import {
  coordenadaValida,
  distanciaAproximadaMetros,
  FaixaEntrega,
  resolverTaxaPorDistancia,
} from './distancia';

export interface LojaOrigemEntrega {
  latitude: number | null;
  longitude: number | null;
}

export interface ClienteLocalizacaoInput {
  latitude: number;
  longitude: number;
}

export type ResultadoCalculoEntregaDistancia =
  | {
      ok: true;
      valorEntrega: number;
      distanciaMetros: number;
      clienteLatitude: number;
      clienteLongitude: number;
    }
  | { ok: false; erro: string };

/**
 * Calcula a taxa de entrega pela estratégia de distância — usada só quando
 * `loja.calcularEntregaPorDistancia` está ligado (ver rota de criação de
 * pedido em public.ts, que decide qual estratégia chamar). Nunca confia em
 * valor/distância vindos do cliente: recalcula tudo a partir da origem
 * cadastrada pela loja e das faixas do banco.
 */
export function calcularTaxaEntregaPorDistancia(
  lojaOrigem: LojaOrigemEntrega,
  faixas: FaixaEntrega[],
  clienteLocalizacao: ClienteLocalizacaoInput | null | undefined,
): ResultadoCalculoEntregaDistancia {
  if (lojaOrigem.latitude === null || lojaOrigem.longitude === null) {
    return {
      ok: false,
      erro: 'Esta loja ainda não configurou a localização necessária para calcular a entrega',
    };
  }

  if (
    !clienteLocalizacao ||
    !coordenadaValida(clienteLocalizacao.latitude, clienteLocalizacao.longitude)
  ) {
    return {
      ok: false,
      erro: 'Não foi possível obter sua localização para calcular a taxa de entrega',
    };
  }

  const distanciaMetros = distanciaAproximadaMetros(
    lojaOrigem.latitude,
    lojaOrigem.longitude,
    clienteLocalizacao.latitude,
    clienteLocalizacao.longitude,
  );

  const resultado = resolverTaxaPorDistancia(faixas, distanciaMetros);
  if (!resultado.ok) {
    return { ok: false, erro: 'Este endereço está fora da área de entrega desta loja.' };
  }

  return {
    ok: true,
    valorEntrega: resultado.valorEntrega,
    distanciaMetros: Math.round(distanciaMetros),
    clienteLatitude: clienteLocalizacao.latitude,
    clienteLongitude: clienteLocalizacao.longitude,
  };
}
