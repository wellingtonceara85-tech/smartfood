/** "48 horas" / "30 minutos" / "3 dias" — espelha backend/src/utils/agendamento.ts pra mensagem amigável no checkout. */
export function formatarAntecedencia(minutos: number): string {
  if (minutos <= 0) return '0 minutos';
  if (minutos % 1440 === 0) {
    const dias = minutos / 1440;
    return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  if (minutos % 60 === 0) {
    const horas = minutos / 60;
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  }
  return `${minutos} minutos`;
}

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Data mínima (YYYY-MM-DD) selecionável no input — piso pro atributo `min`, a validação exata de antecedência é sempre revalidada no servidor. */
export function dataMinimaAgendamento(antecedenciaMinimaMinutos: number): string {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() + antecedenciaMinimaMinutos);
  return paraISO(agora);
}

/**
 * Checagem best-effort no navegador do cliente (fuso do próprio navegador,
 * não necessariamente o da loja) — só pra dar feedback imediato antes de
 * enviar. O servidor sempre revalida no fuso real da loja antes de gravar.
 */
export function agendamentoPareceValido(
  dataISO: string,
  horaHHmm: string,
  antecedenciaMinimaMinutos: number,
): boolean {
  if (!dataISO || !horaHHmm) return false;
  const escolhido = new Date(`${dataISO}T${horaHHmm}:00`);
  if (Number.isNaN(escolhido.getTime())) return false;
  const antecedenciaMs = escolhido.getTime() - Date.now();
  return antecedenciaMs >= antecedenciaMinimaMinutos * 60_000;
}
