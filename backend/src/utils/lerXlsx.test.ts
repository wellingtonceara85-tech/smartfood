import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { test } from 'node:test';
import { lerLinhasXlsx } from './lerXlsx';

async function gerarBufferTeste(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Cardápio');
  worksheet.addRow(['categoria', 'produto', 'preco']);
  worksheet.addRow(['Espetinhos', 'Espetinho de Carne', 8.5]);
  worksheet.addRow(['Bebidas', 'Suco', 6]);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

test('lê linhas de um .xlsx real gerado com exceljs (round-trip)', async () => {
  const buffer = await gerarBufferTeste();
  const linhas = await lerLinhasXlsx(buffer);

  assert.equal(linhas.length, 2);
  assert.equal(linhas[0].categoria, 'Espetinhos');
  assert.equal(linhas[0].produto, 'Espetinho de Carne');
  assert.equal(linhas[0].preco, 8.5);
  assert.equal(linhas[1].produto, 'Suco');
});

test('planilha sem nenhuma aba retorna lista vazia', async () => {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const linhas = await lerLinhasXlsx(Buffer.from(arrayBuffer));
  assert.deepEqual(linhas, []);
});

test('linha totalmente vazia no meio da planilha é ignorada', async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Cardápio');
  worksheet.addRow(['produto', 'preco']);
  worksheet.addRow(['A', 1]);
  worksheet.addRow([]);
  worksheet.addRow(['B', 2]);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const linhas = await lerLinhasXlsx(buffer);
  assert.equal(linhas.length, 2);
});
