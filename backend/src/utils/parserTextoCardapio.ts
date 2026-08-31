import { interpretarPreco } from './precoTexto';

export interface ItemTextoCardapio {
  nome: string;
  descricao: string | null;
  preco: number | null;
  precoTexto: string | null;
  precisaRevisao: boolean;
  motivosRevisao: string[];
}

// Separador exige um hífen/travessão ou dois-pontos explícito — nunca um
// espaço solto, senão qualquer linha com mais de uma palavra ("Pão na
// chapa") seria cortada no meio por engano.
const REGEX_SEPARADOR = /\s*[-–—:]\s*/;
const REGEX_LINHA_COM_SEPARADOR = /^(.*\S)\s*[-–—:]\s*(\S.*)$/;

/**
 * Parser conservador de texto colado (WhatsApp, bloco de notas, redes
 * sociais) — extrai nome/descrição/preço só quando há um separador
 * explícito (hífen ou dois-pontos) no final da linha. Nunca inventa
 * categoria (todo item cai numa categoria única "Sem categoria", decidida
 * por quem chama esta função): quando o preço não é reconhecível, o valor
 * bruto fica preservado em `precoTexto` e o item vai para `precisaRevisao`,
 * nunca com preço zerado/inventado.
 */
export function parseTextoCardapio(texto: string): ItemTextoCardapio[] {
  const linhas = texto
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);

  return linhas.map(parseLinha);
}

function parseLinha(linha: string): ItemTextoCardapio {
  const match = linha.match(REGEX_LINHA_COM_SEPARADOR);

  if (match) {
    const [, restoBruto, caudaBruta] = match;
    const resto = restoBruto.trim();
    const cauda = caudaBruta.trim();

    // Se o que sobrou antes do separador não tiver nenhuma letra,
    // provavelmente não é um nome de produto (ex: "5 - 10,00") — mais seguro
    // tratar a linha inteira como precisando de revisão do que assumir um
    // nome pouco confiável.
    if (/[a-zà-ú]/i.test(resto)) {
      const preco = interpretarPreco(cauda);
      const [nome, ...descricaoPartes] = resto.split(REGEX_SEPARADOR);
      const descricao = descricaoPartes.length > 0 ? descricaoPartes.join(' - ').trim() : null;

      return {
        nome: nome.trim(),
        descricao,
        preco,
        precoTexto: preco === null ? cauda : null,
        precisaRevisao: preco === null,
        motivosRevisao: preco === null ? ['preco_nao_reconhecido'] : [],
      };
    }
  }

  return {
    nome: linha,
    descricao: null,
    preco: null,
    precoTexto: null,
    precisaRevisao: true,
    motivosRevisao: ['sem_preco'],
  };
}
