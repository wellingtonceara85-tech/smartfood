/**
 * Parser de CSV simples (sem dependência externa) — detecta automaticamente
 * o delimitador (vírgula ou ponto-e-vírgula, comum em exportação do Excel
 * em pt-BR) e trata campos entre aspas (com vírgula/ponto-e-vírgula dentro).
 * Primeira linha é sempre o cabeçalho.
 */
export function parseCsv(texto: string): Record<string, string>[] {
  const linhas = texto.split(/\r\n|\r|\n/).filter((linha) => linha.trim().length > 0);
  if (linhas.length === 0) return [];

  const delimitador = detectarDelimitador(linhas[0]);
  const cabecalhos = parseLinhaCsv(linhas[0], delimitador);

  return linhas.slice(1).map((linha) => {
    const valores = parseLinhaCsv(linha, delimitador);
    const objeto: Record<string, string> = {};
    cabecalhos.forEach((cabecalho, indice) => {
      objeto[cabecalho] = valores[indice] ?? '';
    });
    return objeto;
  });
}

function detectarDelimitador(linhaCabecalho: string): ',' | ';' {
  const virgulas = (linhaCabecalho.match(/,/g) ?? []).length;
  const pontoEVirgulas = (linhaCabecalho.match(/;/g) ?? []).length;
  return pontoEVirgulas > virgulas ? ';' : ',';
}

function parseLinhaCsv(linha: string, delimitador: string): string[] {
  const valores: string[] = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const caractere = linha[i];
    if (caractere === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (caractere === delimitador && !dentroDeAspas) {
      valores.push(atual.trim());
      atual = '';
    } else {
      atual += caractere;
    }
  }
  valores.push(atual.trim());
  return valores;
}
