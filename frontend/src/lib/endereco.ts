export const UFS_BRASIL = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export interface EnderecoEntrega {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  referencia: string | null;
}

/** Aplica a máscara 00000-000 enquanto o cliente digita. */
export function maskCep(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

/** Aplica a máscara (00) 00000-0000 (ou 4 dígitos no fixo) enquanto digita. */
export function maskTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function cepValido(valor: string): boolean {
  return valor.replace(/\D/g, '').length === 8;
}

export function telefoneValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11;
}

/** "R$ 5,00" ou "Grátis" quando o valor é zero — usado no select de bairros, no card "Entregar em" e no resumo do pedido. */
export function formatarValorEntrega(valor: number): string {
  return valor === 0 ? 'Grátis' : `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

/** Uma linha, usada no card "Entregar em" resumido e na lista do painel. */
export function formatarEnderecoResumo(
  endereco: Pick<EnderecoEntrega, 'logradouro' | 'numero' | 'bairro' | 'cidade' | 'estado'>,
): string {
  return `${endereco.logradouro}, ${endereco.numero} — ${endereco.bairro} — ${endereco.cidade}/${endereco.estado}`;
}

/** Todas as linhas, usadas no detalhe do painel e na ação "Copiar endereço". */
export function formatarEnderecoCompleto(endereco: EnderecoEntrega): string[] {
  const linhas = [`${endereco.logradouro}, ${endereco.numero}`];
  if (endereco.complemento) linhas.push(endereco.complemento);
  linhas.push(endereco.bairro);
  linhas.push(`${endereco.cidade}/${endereco.estado}`);
  linhas.push(`CEP: ${maskCep(endereco.cep)}`);
  if (endereco.referencia) linhas.push(`Referência: ${endereco.referencia}`);
  return linhas;
}
