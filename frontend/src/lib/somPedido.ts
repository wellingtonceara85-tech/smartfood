const CHAVE_PREFERENCIA_SOM = 'smartfood_som_pedidos_ativado';
const CHAVE_SOM_ESCOLHIDO = 'smartfood_som_pedidos_escolhido';
const CHAVE_DURACAO_ALERTA = 'smartfood_alerta_duracao_segundos';
const CHAVE_REPETICAO_ATIVA = 'smartfood_alerta_repeticao_ativa';
const CHAVE_INTERVALO_REPETICAO = 'smartfood_alerta_intervalo_segundos';

interface WindowComWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export type SomId = 'campainha' | 'cozinha' | 'sino' | 'alerta' | 'discreto';

export interface SomCatalogo {
  id: SomId;
  nome: string;
}

/** Sons sintetizados via Web Audio (osciladores) — sem arquivo de áudio, sem questão de direito autoral. */
export const CATALOGO_SONS: SomCatalogo[] = [
  { id: 'campainha', nome: 'Campainha' },
  { id: 'cozinha', nome: 'Cozinha' },
  { id: 'sino', nome: 'Sino' },
  { id: 'alerta', nome: 'Alerta' },
  { id: 'discreto', nome: 'Discreto' },
];

const SOM_PADRAO: SomId = 'campainha';

/** Um "toque" desse som — sequência de notas tocadas em sequência, depois um intervalo até repetir. */
interface NotaSom {
  frequencia: number;
  duracaoMs: number;
  tipo: OscillatorType;
}

const PADROES_SOM: Record<SomId, { notas: NotaSom[]; gapEntreRepeticoesMs: number }> = {
  campainha: {
    notas: [
      { frequencia: 880, duracaoMs: 180, tipo: 'sine' },
      { frequencia: 660, duracaoMs: 220, tipo: 'sine' },
    ],
    gapEntreRepeticoesMs: 700,
  },
  cozinha: {
    notas: [
      { frequencia: 1046, duracaoMs: 120, tipo: 'square' },
      { frequencia: 1046, duracaoMs: 120, tipo: 'square' },
      { frequencia: 1046, duracaoMs: 120, tipo: 'square' },
    ],
    gapEntreRepeticoesMs: 900,
  },
  sino: {
    notas: [{ frequencia: 1318, duracaoMs: 500, tipo: 'triangle' }],
    gapEntreRepeticoesMs: 850,
  },
  alerta: {
    notas: [
      { frequencia: 988, duracaoMs: 150, tipo: 'sawtooth' },
      { frequencia: 740, duracaoMs: 150, tipo: 'sawtooth' },
      { frequencia: 988, duracaoMs: 150, tipo: 'sawtooth' },
      { frequencia: 740, duracaoMs: 150, tipo: 'sawtooth' },
    ],
    gapEntreRepeticoesMs: 500,
  },
  discreto: {
    notas: [{ frequencia: 523, duracaoMs: 160, tipo: 'sine' }],
    gapEntreRepeticoesMs: 1600,
  },
};

// --- Preferência de tocar som (liga/desliga geral) ---

/**
 * Preferência de som por dispositivo/navegador — não existe conceito de
 * "conta" pra isso, cada aparelho decide o próprio volume de aviso. Default
 * ligado: o som já toca sem toggle em produção hoje, então manter ligado por
 * padrão evita regressão de comportamento.
 */
export function lerPreferenciaSom(): boolean {
  const valor = localStorage.getItem(CHAVE_PREFERENCIA_SOM);
  return valor === null ? true : valor === 'true';
}

export function salvarPreferenciaSom(ativado: boolean): void {
  localStorage.setItem(CHAVE_PREFERENCIA_SOM, String(ativado));
}

// --- Som escolhido ---

export function lerSomEscolhido(): SomId {
  const valor = localStorage.getItem(CHAVE_SOM_ESCOLHIDO);
  return CATALOGO_SONS.some((s) => s.id === valor) ? (valor as SomId) : SOM_PADRAO;
}

export function salvarSomEscolhido(somId: SomId): void {
  localStorage.setItem(CHAVE_SOM_ESCOLHIDO, somId);
}

// --- Duração do alerta (quanto tempo o padrão de som toca por disparo) ---

export const DURACAO_ALERTA_MIN_S = 2;
export const DURACAO_ALERTA_MAX_S = 20;
export const DURACAO_ALERTA_PADRAO_S = 6;

export function clampDuracaoAlerta(segundos: number): number {
  return Math.min(DURACAO_ALERTA_MAX_S, Math.max(DURACAO_ALERTA_MIN_S, Math.round(segundos)));
}

export function lerDuracaoAlerta(): number {
  const valor = Number(localStorage.getItem(CHAVE_DURACAO_ALERTA));
  return Number.isFinite(valor) && valor > 0 ? clampDuracaoAlerta(valor) : DURACAO_ALERTA_PADRAO_S;
}

export function salvarDuracaoAlerta(segundos: number): void {
  localStorage.setItem(CHAVE_DURACAO_ALERTA, String(clampDuracaoAlerta(segundos)));
}

// --- Repetição enquanto houver pedido pendente ---

export const INTERVALO_REPETICAO_MIN_S = 20;
export const INTERVALO_REPETICAO_MAX_S = 300;
export const INTERVALO_REPETICAO_PADRAO_S = 60;

export function clampIntervaloRepeticao(segundos: number): number {
  return Math.min(
    INTERVALO_REPETICAO_MAX_S,
    Math.max(INTERVALO_REPETICAO_MIN_S, Math.round(segundos)),
  );
}

export function lerRepeticaoAtiva(): boolean {
  return localStorage.getItem(CHAVE_REPETICAO_ATIVA) === 'true';
}

export function salvarRepeticaoAtiva(ativa: boolean): void {
  localStorage.setItem(CHAVE_REPETICAO_ATIVA, String(ativa));
}

export function lerIntervaloRepeticao(): number {
  const valor = Number(localStorage.getItem(CHAVE_INTERVALO_REPETICAO));
  return Number.isFinite(valor) && valor > 0
    ? clampIntervaloRepeticao(valor)
    : INTERVALO_REPETICAO_PADRAO_S;
}

export function salvarIntervaloRepeticao(segundos: number): void {
  localStorage.setItem(CHAVE_INTERVALO_REPETICAO, String(clampIntervaloRepeticao(segundos)));
}

// --- Reprodução ---

let contextoAtivo: AudioContext | null = null;
let timeoutsAgendados: ReturnType<typeof setTimeout>[] = [];

function tocarNota(ctx: AudioContext, nota: NotaSom): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = nota.tipo;
    osc.frequency.value = nota.frequencia;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + nota.duracaoMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + nota.duracaoMs / 1000);
  } catch {
    // Nota individual falhou — segue o padrão, sem travar o restante do alerta.
  }
}

/**
 * Para imediatamente qualquer som em andamento/agendado — usado pelo botão
 * "Silenciar alerta" e antes de iniciar um novo ciclo (garante que nunca
 * toquem dois áudios sobrepostos: um novo disparo sempre cancela o anterior).
 * Não mexe em nenhum pedido nem desliga a repetição futura — quem controla
 * o ciclo de repetição é o chamador (ver NotificacoesContext).
 */
export function pararAlertaSonoro(): void {
  for (const id of timeoutsAgendados) clearTimeout(id);
  timeoutsAgendados = [];
  if (contextoAtivo) {
    try {
      contextoAtivo.close();
    } catch {
      // já fechado/indisponível — sem problema, só limpamos a referência.
    }
    contextoAtivo = null;
  }
}

/**
 * Toca o padrão do som escolhido em loop pela duração configurada (em
 * segundos). Navegadores bloqueiam autoplay sem gesto prévio do usuário:
 * nesse caso a chamada só falha silenciosamente (o destaque visual do card
 * novo continua funcionando). Cancela qualquer alerta anterior antes de
 * começar — nunca dois áudios ao mesmo tempo.
 */
export function tocarAlertaSonoro(
  somId: SomId = lerSomEscolhido(),
  duracaoSegundos: number = lerDuracaoAlerta(),
): void {
  pararAlertaSonoro();

  try {
    const AudioCtx = window.AudioContext ?? (window as WindowComWebkitAudio).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    contextoAtivo = ctx;

    const padrao = PADROES_SOM[somId] ?? PADROES_SOM[SOM_PADRAO];
    const duracaoUnidadeMs = padrao.notas.reduce((soma, n) => soma + n.duracaoMs, 0);
    const cicloMs = duracaoUnidadeMs + padrao.gapEntreRepeticoesMs;
    const limiteMs = clampDuracaoAlerta(duracaoSegundos) * 1000;

    let decorridoMs = 0;
    while (decorridoMs < limiteMs) {
      const inicioCiclo = decorridoMs;
      const id = setTimeout(() => {
        let offset = 0;
        for (const nota of padrao.notas) {
          const idNota = setTimeout(() => tocarNota(ctx, nota), offset);
          timeoutsAgendados.push(idNota);
          offset += nota.duracaoMs;
        }
      }, inicioCiclo);
      timeoutsAgendados.push(id);
      decorridoMs += cicloMs;
    }

    const idFechamento = setTimeout(() => {
      if (contextoAtivo === ctx) {
        pararAlertaSonoro();
      }
    }, limiteMs + 200);
    timeoutsAgendados.push(idFechamento);
  } catch {
    // AudioContext indisponível ou bloqueado — sem alerta sonoro, o destaque visual basta.
  }
}
