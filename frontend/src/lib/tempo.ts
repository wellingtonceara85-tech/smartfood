/** "há 2 min" / "há 1h 05" / "há 3 dias" — usado na Central de Pedidos pra mostrar há quanto tempo o pedido está no fluxo. */
export function formatarTempoDecorrido(dataISO: string, agora: Date = new Date()): string {
  const inicio = new Date(dataISO).getTime();
  const minutosTotais = Math.max(0, Math.floor((agora.getTime() - inicio) / 60_000));

  if (minutosTotais < 1) return 'agora mesmo';
  if (minutosTotais < 60) return `há ${minutosTotais} min`;

  const horas = Math.floor(minutosTotais / 60);
  const minutosRestantes = minutosTotais % 60;
  if (horas < 24) {
    return minutosRestantes > 0
      ? `há ${horas}h ${String(minutosRestantes).padStart(2, '0')}`
      : `há ${horas}h`;
  }

  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}
