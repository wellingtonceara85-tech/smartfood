/**
 * Gerador de payload Pix (BR Code / EMV QRCPS-MPM), 100% local — sem
 * chamada a API externa, sem PSP, sem cobrança dinâmica. Implementa só o
 * necessário do "Manual de Padrões para Iniciação do Pix" do Bacen: um
 * payload ESTÁTICO com valor fixo (o total já calculado/validado do
 * pedido), pronto pra virar QR Code ou ser colado ("Pix Copia e Cola").
 */

export type TipoChavePix = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';

export interface DadosPixLoja {
  chavePix: string;
  tipoChave: TipoChavePix;
  titular: string;
  cidade: string;
}

function tlv(id: string, valor: string): string {
  return `${id}${valor.length.toString().padStart(2, '0')}${valor}`;
}

// Só dígitos — usado pra CPF/CNPJ/telefone, tanto na chave quanto na formatação do valor.
function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Texto seguro pro payload EMV: sem acento, maiúsculo, só o essencial (o
// padrão exige charset restrito pra nome/cidade do beneficiário).
function textoSeguro(valor: string, tamanhoMax: number): string {
  const semAcento = valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '');
  return (semAcento.trim() || 'SMARTFOOD').slice(0, tamanhoMax);
}

/** Normaliza a chave conforme o tipo, do jeito que o Bacen exige no payload (não altera o que fica salvo no cadastro da loja). */
export function normalizarChavePix(tipo: TipoChavePix, chave: string): string {
  const valor = chave.trim();
  switch (tipo) {
    case 'cpf':
    case 'cnpj':
      return apenasDigitos(valor);
    case 'telefone': {
      const digitos = apenasDigitos(valor);
      const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`;
      return `+${comDdi}`;
    }
    case 'email':
      return valor.toLowerCase();
    case 'aleatoria':
      return valor;
  }
}

function cpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos)) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false; // todos os dígitos iguais nunca é CPF real
  const digitoVerificador = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digitoVerificador(digitos.slice(0, 9), 10);
  const d2 = digitoVerificador(digitos.slice(0, 9) + d1, 11);
  return digitos === digitos.slice(0, 9) + String(d1) + String(d2);
}

function cnpjValido(digitos: string): boolean {
  if (!/^\d{14}$/.test(digitos)) return false;
  if (/^(\d)\1{13}$/.test(digitos)) return false;
  const digitoVerificador = (base: string, pesos: number[]) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digitoVerificador(digitos.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(digitos.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digitos === digitos.slice(0, 12) + String(d1) + String(d2);
}

// +55, DDD de 2 dígitos (11-99) e 8 ou 9 dígitos de número — se forem 9, o
// primeiro precisa ser "9" (celular). Checagem de "quantidade plausível", não
// confere se o DDD existe de fato na lista da Anatel nem se a linha existe.
function telefonePixValido(e164: string): boolean {
  const m = /^\+55(\d{2})(\d{8,9})$/.exec(e164);
  if (!m) return false;
  const ddd = Number(m[1]);
  if (ddd < 11 || ddd > 99) return false;
  const numero = m[2];
  if (numero.length === 9 && numero[0] !== '9') return false;
  return true;
}

// Formato sintático simples (usuário@domínio.tld) — não confere se o
// endereço existe de fato, só a forma.
function emailPixValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Chave aleatória (EVP) do Pix é sempre um UUID — só confere o formato.
function chaveAleatoriaValida(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

/**
 * Validação SINTÁTICA da chave conforme o tipo escolhido — confere formato e
 * dígitos verificadores (CPF/CNPJ), nunca consulta DICT/banco. Passar aqui
 * não significa que a chave existe, pertence a alguém ou está registrada no
 * Pix de verdade — só que tem a forma correta desse tipo de chave.
 */
export function validarChavePix(tipo: TipoChavePix, chave: string): boolean {
  const normalizada = normalizarChavePix(tipo, chave);
  switch (tipo) {
    case 'cpf':
      return cpfValido(normalizada);
    case 'cnpj':
      return cnpjValido(normalizada);
    case 'telefone':
      return telefonePixValido(normalizada);
    case 'email':
      return emailPixValido(normalizada);
    case 'aleatoria':
      return chaveAleatoriaValida(normalizada);
  }
}

export const MENSAGEM_ERRO_CHAVE_PIX: Record<TipoChavePix, string> = {
  cpf: 'CPF informado não é válido.',
  cnpj: 'CNPJ informado não é válido.',
  telefone: 'Telefone Pix inválido.',
  email: 'E-mail Pix inválido.',
  aleatoria: 'Chave aleatória Pix inválida.',
};

/** CRC16-CCITT (poly 0x1021, init 0xFFFF) — exigido como último campo (63) do payload, em hex maiúsculo de 4 dígitos. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Monta o payload Pix estático completo pro pedido — valor sempre o `total`
 * já calculado pelo backend (nunca um valor livre vindo do frontend).
 * `referencia` vira o txid (campo 62/05) — só dígitos/letras, sem espaço.
 */
export function gerarPayloadPix(loja: DadosPixLoja, valor: number, referencia: string): string {
  const chaveNormalizada = normalizarChavePix(loja.tipoChave, loja.chavePix);

  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', chaveNormalizada);

  const txid = (referencia.replace(/[^A-Za-z0-9]/g, '') || '***').slice(0, 25);
  const additionalData = tlv('05', txid);

  const semCrc =
    tlv('00', '01') + // Payload Format Indicator
    tlv('01', '11') + // Point of Initiation Method: estático
    tlv('26', merchantAccountInfo) + // Merchant Account Information — Pix
    tlv('52', '0000') + // Merchant Category Code
    tlv('53', '986') + // Transaction Currency: BRL
    tlv('54', valor.toFixed(2)) + // Transaction Amount
    tlv('58', 'BR') + // Country Code
    tlv('59', textoSeguro(loja.titular, 25)) + // Merchant Name
    tlv('60', textoSeguro(loja.cidade, 15)) + // Merchant City
    tlv('62', additionalData) + // Additional Data Field Template
    '6304'; // ID+tamanho do próprio CRC, sem o valor — o CRC cobre até aqui

  return semCrc + crc16(semCrc);
}

/**
 * True só quando a loja tem os 4 dados necessários E a chave passa na
 * validação sintática do tipo informado — senão o Pix manual continua
 * funcionando só com a chave em texto (comportamento atual, sem QR). Nunca
 * bloqueia o pedido: uma chave inválida só significa "sem QR desta vez",
 * igual a uma loja que nunca preencheu os dados avançados.
 */
export function lojaTemDadosPixCompletos(loja: {
  chavePix: string | null;
  pixTipoChave: string | null;
  pixTitular: string | null;
  pixCidade: string | null;
}): loja is {
  chavePix: string;
  pixTipoChave: TipoChavePix;
  pixTitular: string;
  pixCidade: string;
} {
  const dadosPresentes = Boolean(
    loja.chavePix?.trim() &&
    loja.pixTipoChave &&
    ['cpf', 'cnpj', 'telefone', 'email', 'aleatoria'].includes(loja.pixTipoChave) &&
    loja.pixTitular?.trim() &&
    loja.pixCidade?.trim(),
  );
  if (!dadosPresentes) return false;
  return validarChavePix(loja.pixTipoChave as TipoChavePix, loja.chavePix as string);
}
