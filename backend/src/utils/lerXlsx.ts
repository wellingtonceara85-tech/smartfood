import ExcelJS from 'exceljs';

/** Lê a primeira planilha de um .xlsx (buffer) e devolve as linhas como objetos cabeçalho→valor, igual ao formato que parsePlanilhaCardapio espera. */
export async function lerLinhasXlsx(buffer: Buffer): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const linhaCabecalho = worksheet.getRow(1);
  const cabecalhos: string[] = [];
  linhaCabecalho.eachCell({ includeEmpty: false }, (cell, numeroColuna) => {
    cabecalhos[numeroColuna] = String(cell.value ?? '').trim();
  });

  const linhas: Record<string, unknown>[] = [];
  worksheet.eachRow((row, numeroLinha) => {
    if (numeroLinha === 1) return;

    const objeto: Record<string, unknown> = {};
    let temAlgumValor = false;
    row.eachCell({ includeEmpty: false }, (cell, numeroColuna) => {
      const cabecalho = cabecalhos[numeroColuna];
      if (!cabecalho) return;
      objeto[cabecalho] = celulaParaValor(cell.value);
      temAlgumValor = true;
    });
    if (temAlgumValor) linhas.push(objeto);
  });

  return linhas;
}

function celulaParaValor(valor: ExcelJS.CellValue): unknown {
  if (valor && typeof valor === 'object') {
    if ('text' in valor) return (valor as { text: string }).text;
    if ('result' in valor) return (valor as { result: unknown }).result;
    if (valor instanceof Date) return valor.toISOString();
  }
  return valor;
}
