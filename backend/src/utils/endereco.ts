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
] as const;

/** Remove tudo que não for dígito. */
function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Normaliza telefone brasileiro pro formato só-dígitos (DDD + número),
 * aceitando qualquer formatação de entrada — (85) 99940-4661, 85999404661,
 * com ou sem +55. Retorna null se não tiver 10 ou 11 dígitos após limpar
 * (fixo = 10, celular = 11), ignorando um DDI 55 opcional na frente.
 */
export function normalizarTelefone(valor: string): string | null {
  let digitos = somenteDigitos(valor);
  if (digitos.length === 12 || digitos.length === 13) {
    // Tem DDI 55 na frente (ex: 5585999404661) — remove pra sobrar DDD+número.
    if (digitos.startsWith('55')) digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  return digitos;
}

/** Normaliza CEP pro formato só-dígitos. Retorna null se não tiver 8 dígitos. */
export function normalizarCep(valor: string): string | null {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 8) return null;
  return digitos;
}

/** Normaliza UF pra maiúsculas e valida contra a lista de estados brasileiros. */
export function normalizarUf(valor: string): string | null {
  const uf = valor.trim().toUpperCase();
  if (!(UFS_BRASIL as readonly string[]).includes(uf)) return null;
  return uf;
}

export interface EnderecoEntregaInput {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  cidade: string;
  estado: string;
  referencia?: string | null;
}

export interface EnderecoEntregaNormalizado {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  cidade: string;
  estado: string;
  referencia: string | null;
}

export type ResultadoValidacaoEndereco =
  { valido: true; endereco: EnderecoEntregaNormalizado } | { valido: false; erro: string };

/**
 * Valida e normaliza o endereço de entrega. Regra de domínio: só é chamada
 * quando formaRecebimento === 'entrega' — retirada nunca exige endereço.
 */
export function validarEnderecoEntrega(
  input: Partial<EnderecoEntregaInput> | null | undefined,
): ResultadoValidacaoEndereco {
  if (!input) return { valido: false, erro: 'Endereço de entrega é obrigatório' };

  const cep = normalizarCep(input.cep ?? '');
  if (!cep) return { valido: false, erro: 'CEP inválido — use o formato 00000-000' };

  const logradouro = (input.logradouro ?? '').trim();
  if (!logradouro) return { valido: false, erro: 'Informe a rua/logradouro' };

  const numero = (input.numero ?? '').trim();
  if (!numero) return { valido: false, erro: 'Informe o número' };

  const cidade = (input.cidade ?? '').trim();
  if (!cidade) return { valido: false, erro: 'Informe a cidade' };

  const estado = normalizarUf(input.estado ?? '');
  if (!estado) return { valido: false, erro: 'Estado (UF) inválido' };

  const complemento = (input.complemento ?? '').trim();
  const referencia = (input.referencia ?? '').trim();

  return {
    valido: true,
    endereco: {
      cep,
      logradouro,
      numero,
      complemento: complemento || null,
      cidade,
      estado,
      referencia: referencia || null,
    },
  };
}
