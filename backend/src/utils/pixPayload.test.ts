import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  crc16,
  gerarPayloadPix,
  lojaTemDadosPixCompletos,
  MENSAGEM_ERRO_CHAVE_PIX,
  normalizarChavePix,
  validarChavePix,
} from './pixPayload';

// Vetor de teste oficial do CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF,
// sem reflexão) — mesmo algoritmo exigido pelo campo 63 do Pix. Se esse
// teste passar, o CRC do payload está correto.
test('crc16 bate com o vetor de teste oficial CRC-16/CCITT-FALSE', () => {
  assert.equal(crc16('123456789'), '29B1');
});

test('normalizarChavePix — cpf/cnpj ficam só com dígitos', () => {
  assert.equal(normalizarChavePix('cpf', '123.456.789-00'), '12345678900');
  assert.equal(normalizarChavePix('cnpj', '12.345.678/0001-90'), '12345678000190');
});

test('normalizarChavePix — telefone vira E.164 com +55', () => {
  assert.equal(normalizarChavePix('telefone', '(85) 99999-9999'), '+5585999999999');
  assert.equal(normalizarChavePix('telefone', '5585999999999'), '+5585999999999');
  assert.equal(normalizarChavePix('telefone', '+5585999999999'), '+5585999999999');
});

test('normalizarChavePix — email vira minúsculo, aleatoria fica igual', () => {
  assert.equal(normalizarChavePix('email', 'Dono@Loja.com '), 'dono@loja.com');
  assert.equal(
    normalizarChavePix('aleatoria', '123e4567-e89b-12d3-a456-426614174000'),
    '123e4567-e89b-12d3-a456-426614174000',
  );
});

function parsearTlv(payload: string): Record<string, string> {
  const campos: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const tamanho = Number(payload.slice(i + 2, i + 4));
    const valor = payload.slice(i + 4, i + 4 + tamanho);
    campos[id] = valor;
    i += 4 + tamanho;
  }
  return campos;
}

test('gerarPayloadPix — estrutura e campos batem com os dados informados', () => {
  const payload = gerarPayloadPix(
    {
      chavePix: 'dono@loja.com',
      tipoChave: 'email',
      titular: 'João da Silva Ltda',
      cidade: 'São Paulo',
    },
    35.9,
    'PED42',
  );

  // CRC: os últimos 4 caracteres devem ser exatamente o CRC do restante.
  const semCrc = payload.slice(0, -4);
  const crcInformado = payload.slice(-4);
  assert.equal(crcInformado, crc16(semCrc));

  const campos = parsearTlv(semCrc + '6304');
  assert.equal(campos['00'], '01');
  assert.equal(campos['52'], '0000');
  assert.equal(campos['53'], '986');
  assert.equal(campos['54'], '35.90');
  assert.equal(campos['58'], 'BR');
  assert.equal(campos['59'], 'JOAO DA SILVA LTDA');
  assert.equal(campos['60'], 'SAO PAULO');

  const merchantInfo = parsearTlv(campos['26']);
  assert.equal(merchantInfo['00'], 'br.gov.bcb.pix');
  assert.equal(merchantInfo['01'], 'dono@loja.com');

  const additional = parsearTlv(campos['62']);
  assert.equal(additional['05'], 'PED42');
});

test('gerarPayloadPix — nome/cidade truncados no tamanho máximo do padrão (25/15) e sem acento', () => {
  const payload = gerarPayloadPix(
    {
      chavePix: '11122233344',
      tipoChave: 'cpf',
      titular: 'Restaurante da Ana e Cia Alimentação',
      cidade: 'São João dos Inhamuns',
    },
    10,
    '***',
  );
  const campos = parsearTlv(payload.slice(0, -4) + '6304');
  assert.ok(campos['59'].length <= 25);
  assert.ok(campos['60'].length <= 15);
  assert.equal(/[ÀÁÃÇÕ]/.test(campos['59'] + campos['60']), false);
});

test('gerarPayloadPix — valor sempre com 2 casas decimais, mesmo em número inteiro', () => {
  const payload = gerarPayloadPix(
    { chavePix: 'x', tipoChave: 'aleatoria', titular: 'Loja', cidade: 'Fortaleza' },
    50,
    'PED1',
  );
  const campos = parsearTlv(payload.slice(0, -4) + '6304');
  assert.equal(campos['54'], '50.00');
});

test('lojaTemDadosPixCompletos — só true quando os 4 campos estão preenchidos e o tipo é válido', () => {
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: 'dono@loja.com',
      pixTipoChave: 'email',
      pixTitular: 'Loja',
      pixCidade: 'Fortaleza',
    }),
    true,
  );
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: 'dono@loja.com',
      pixTipoChave: null,
      pixTitular: null,
      pixCidade: null,
    }),
    false,
  );
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: 'dono@loja.com',
      pixTipoChave: 'tipo-invalido',
      pixTitular: 'Loja',
      pixCidade: 'Fortaleza',
    }),
    false,
  );
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: null,
      pixTipoChave: 'email',
      pixTitular: 'Loja',
      pixCidade: 'Fortaleza',
    }),
    false,
  );
});

// --- Validação sintática por tipo (novo) ---
// Importante: isso é só forma (dígito verificador, formato) — nunca confirma
// que a chave existe de fato ou pertence a alguém (sem DICT/banco).

test('validarChavePix — CPF válido e inválido', () => {
  assert.equal(validarChavePix('cpf', '111.444.777-35'), true); // CPF de teste válido conhecido
  assert.equal(validarChavePix('cpf', '529.982.247-25'), true); // outro CPF de teste válido conhecido
  assert.equal(validarChavePix('cpf', '123.456.789-00'), false); // dígito verificador errado
  assert.equal(validarChavePix('cpf', '111.111.111-11'), false); // todos os dígitos iguais
  assert.equal(validarChavePix('cpf', '123'), false); // tamanho errado
});

test('validarChavePix — CNPJ válido e inválido', () => {
  assert.equal(validarChavePix('cnpj', '11.222.333/0001-81'), true); // CNPJ de teste válido conhecido
  assert.equal(validarChavePix('cnpj', '11.222.333/0001-99'), false); // dígito verificador errado
  assert.equal(validarChavePix('cnpj', '11.111.111/1111-11'), false); // todos os dígitos iguais
  assert.equal(validarChavePix('cnpj', '123'), false); // tamanho errado
});

test('validarChavePix — telefone nas variações aceitas e telefone inválido', () => {
  assert.equal(validarChavePix('telefone', '(85) 99999-8888'), true); // celular, sem DDI, com formatação
  assert.equal(validarChavePix('telefone', '5585999998888'), true); // celular, com DDI, sem formatação
  assert.equal(validarChavePix('telefone', '+5585999998888'), true); // celular, já em E.164
  assert.equal(validarChavePix('telefone', '8532221234'), true); // fixo (8 dígitos), sem DDI
  assert.equal(validarChavePix('telefone', '85812345678'), false); // 9 dígitos após o DDD, mas não começa com 9 (celular mal formado)
  assert.equal(validarChavePix('telefone', '859999888'), false); // quantidade de dígitos implausível (nem 8 nem 9 após o DDD)
  assert.equal(validarChavePix('telefone', '123'), false); // claramente inválido
});

test('validarChavePix — e-mail válido e inválido', () => {
  assert.equal(validarChavePix('email', 'dono@loja.com'), true);
  assert.equal(validarChavePix('email', 'Dono@Loja.COM.BR'), true);
  assert.equal(validarChavePix('email', 'nao-e-email'), false);
  assert.equal(validarChavePix('email', '@loja.com'), false);
  assert.equal(validarChavePix('email', 'dono@semdominio'), false);
});

test('validarChavePix — chave aleatória válida e inválida', () => {
  assert.equal(validarChavePix('aleatoria', '123e4567-e89b-12d3-a456-426614174000'), true);
  assert.equal(validarChavePix('aleatoria', '123E4567-E89B-12D3-A456-426614174000'), true); // maiúsculo também é aceito
  assert.equal(validarChavePix('aleatoria', 'nao-e-uma-chave-aleatoria-valida'), false);
  assert.equal(validarChavePix('aleatoria', '123e4567e89b12d3a456426614174000'), false); // sem os traços
});

test('lojaTemDadosPixCompletos — chave com formato inválido para o tipo nunca gera payload (mesmo com os outros 3 campos completos)', () => {
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: '123.456.789-00', // CPF com dígito verificador errado
      pixTipoChave: 'cpf',
      pixTitular: 'Loja',
      pixCidade: 'Fortaleza',
    }),
    false,
  );
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: 'nao-e-um-email',
      pixTipoChave: 'email',
      pixTitular: 'Loja',
      pixCidade: 'Fortaleza',
    }),
    false,
  );
});

test('lojaTemDadosPixCompletos — loja antiga (só chavePix, sem tipo/titular/cidade) nunca gera payload, mas também nunca é bloqueada — só cai no modo simples', () => {
  assert.equal(
    lojaTemDadosPixCompletos({
      chavePix: 'chave-qualquer-de-loja-antiga',
      pixTipoChave: null,
      pixTitular: null,
      pixCidade: null,
    }),
    false,
  );
});

test('MENSAGEM_ERRO_CHAVE_PIX — uma mensagem clara por tipo, sem afirmar que a chave existe/pertence a alguém', () => {
  assert.equal(MENSAGEM_ERRO_CHAVE_PIX.cpf, 'CPF informado não é válido.');
  assert.equal(MENSAGEM_ERRO_CHAVE_PIX.cnpj, 'CNPJ informado não é válido.');
  assert.equal(MENSAGEM_ERRO_CHAVE_PIX.telefone, 'Telefone Pix inválido.');
  assert.equal(MENSAGEM_ERRO_CHAVE_PIX.email, 'E-mail Pix inválido.');
  assert.equal(MENSAGEM_ERRO_CHAVE_PIX.aleatoria, 'Chave aleatória Pix inválida.');
});
