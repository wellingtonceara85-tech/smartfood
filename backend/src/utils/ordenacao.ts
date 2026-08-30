export interface ResultadoNovaOrdem {
  valida: boolean;
  erro?: string;
  ordemPorId?: Map<string, number>;
}

/**
 * A partir da lista de ids na nova ordem (a que o lojista arrastou pro
 * lugar), calcula a posição (0, 1, 2...) de cada um. `idsAtuais` é o
 * conjunto de ids que realmente pertencem ao recurso sendo reordenado (a
 * loja, ou a categoria, dependendo do que está sendo ordenado) — usado só
 * pra validar que `novaOrdem` é exatamente uma permutação dele, nunca pra
 * decidir a ordem em si. Protege contra payload adulterado: id de outra
 * loja/categoria, id repetido, id faltando ou item a mais.
 */
export function calcularNovaOrdem(idsAtuais: string[], novaOrdem: string[]): ResultadoNovaOrdem {
  if (novaOrdem.length !== idsAtuais.length) {
    return {
      valida: false,
      erro: 'A nova ordem precisa conter todos os itens, sem faltar nem sobrar',
    };
  }

  const atuaisSet = new Set(idsAtuais);
  const vistos = new Set<string>();
  for (const id of novaOrdem) {
    if (!atuaisSet.has(id)) {
      return { valida: false, erro: 'A nova ordem contém um item que não pertence a este recurso' };
    }
    if (vistos.has(id)) {
      return { valida: false, erro: 'A nova ordem contém um item duplicado' };
    }
    vistos.add(id);
  }

  const ordemPorId = new Map<string, number>();
  novaOrdem.forEach((id, indice) => ordemPorId.set(id, indice));
  return { valida: true, ordemPorId };
}

/** Próxima posição livre no fim de uma lista já ordenada por `ordem` — usada ao criar/duplicar/mover um item pro fim da categoria de destino. */
export function proximaOrdem(existentes: { ordem: number }[]): number {
  if (existentes.length === 0) return 0;
  return Math.max(...existentes.map((item) => item.ordem)) + 1;
}
