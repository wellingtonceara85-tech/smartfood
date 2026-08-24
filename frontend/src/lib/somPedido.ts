const CHAVE_PREFERENCIA_SOM = 'smartfood_som_pedidos_ativado';

interface WindowComWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Preferência de som por dispositivo/navegador — não existe conceito de
 * "conta" pra isso, cada aparelho decide o próprio volume de aviso. Default
 * ligado: o som já toca sem toggle em produção hoje (PainelPedidos), então
 * manter ligado por padrão evita regressão de comportamento.
 */
export function lerPreferenciaSom(): boolean {
  const valor = localStorage.getItem(CHAVE_PREFERENCIA_SOM);
  return valor === null ? true : valor === 'true';
}

export function salvarPreferenciaSom(ativado: boolean): void {
  localStorage.setItem(CHAVE_PREFERENCIA_SOM, String(ativado));
}

// Alerta curto via Web Audio API — sem depender de um arquivo de áudio novo.
// Navegadores bloqueiam autoplay de som sem gesto prévio do usuário: nesse
// caso a chamada só falha silenciosamente (o destaque visual do card novo
// continua funcionando). Uma vez que o lojista interaja com a página (clique
// em qualquer botão), o contexto de áudio já fica liberado pro navegador.
export function tocarAlertaSonoro(): void {
  try {
    const AudioCtx = window.AudioContext ?? (window as WindowComWebkitAudio).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext indisponível ou bloqueado — sem alerta sonoro, o destaque visual basta.
  }
}
