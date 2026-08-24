import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CATALOGO_SONS,
  DURACAO_ALERTA_MAX_S,
  DURACAO_ALERTA_MIN_S,
  INTERVALO_REPETICAO_MAX_S,
  INTERVALO_REPETICAO_MIN_S,
  lerDuracaoAlerta,
  lerIntervaloRepeticao,
  lerRepeticaoAtiva,
  lerSomEscolhido,
  pararAlertaSonoro,
  salvarDuracaoAlerta,
  salvarIntervaloRepeticao,
  salvarRepeticaoAtiva,
  salvarSomEscolhido,
  tocarAlertaSonoro,
} from './somPedido';

/** Ambiente de teste é `node` (vitest.config) — sem window/localStorage/AudioContext reais, então simulamos o mínimo necessário. */
class ArmazenamentoFalso {
  private dados = new Map<string, string>();
  getItem(chave: string) {
    return this.dados.has(chave) ? this.dados.get(chave)! : null;
  }
  setItem(chave: string, valor: string) {
    this.dados.set(chave, valor);
  }
  removeItem(chave: string) {
    this.dados.delete(chave);
  }
}

let osciladoresCriados = 0;

class OsciladorFalso {
  type = 'sine';
  frequency = { value: 0 };
  connect() {}
  start() {}
  stop() {}
}

class GainFalso {
  gain = {
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
  };
  connect() {}
}

class AudioContextFalso {
  currentTime = 0;
  destination = {};
  createOscillator() {
    osciladoresCriados += 1;
    return new OsciladorFalso() as unknown as OscillatorNode;
  }
  createGain() {
    return new GainFalso() as unknown as GainNode;
  }
  close() {}
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new ArmazenamentoFalso() as unknown as Storage;
  (globalThis as unknown as { window: unknown }).window = globalThis;
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = AudioContextFalso;
  osciladoresCriados = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  pararAlertaSonoro();
  vi.useRealTimers();
});

describe('som escolhido', () => {
  it('tem um padrão válido do catálogo quando nada foi salvo ainda', () => {
    const escolhido = lerSomEscolhido();
    expect(CATALOGO_SONS.some((s) => s.id === escolhido)).toBe(true);
  });

  it('persiste a escolha do lojista', () => {
    salvarSomEscolhido('sino');
    expect(lerSomEscolhido()).toBe('sino');
  });

  it('cai no padrão se o valor salvo não é mais um som válido', () => {
    localStorage.setItem('smartfood_som_pedidos_escolhido', 'som-que-nao-existe-mais');
    expect(CATALOGO_SONS.some((s) => s.id === lerSomEscolhido())).toBe(true);
  });
});

describe('duração do alerta', () => {
  it('tem um valor padrão dentro dos limites seguros', () => {
    const duracao = lerDuracaoAlerta();
    expect(duracao).toBeGreaterThanOrEqual(DURACAO_ALERTA_MIN_S);
    expect(duracao).toBeLessThanOrEqual(DURACAO_ALERTA_MAX_S);
  });

  it('não permite valor absurdo — trava no teto configurado', () => {
    salvarDuracaoAlerta(9999);
    expect(lerDuracaoAlerta()).toBe(DURACAO_ALERTA_MAX_S);
  });

  it('não permite valor abaixo do piso configurado', () => {
    salvarDuracaoAlerta(0);
    expect(lerDuracaoAlerta()).toBe(DURACAO_ALERTA_MIN_S);
  });
});

describe('repetição do alerta', () => {
  it('vem desligada por padrão', () => {
    expect(lerRepeticaoAtiva()).toBe(false);
  });

  it('liga/desliga e persiste', () => {
    salvarRepeticaoAtiva(true);
    expect(lerRepeticaoAtiva()).toBe(true);
    salvarRepeticaoAtiva(false);
    expect(lerRepeticaoAtiva()).toBe(false);
  });

  it('intervalo de repetição respeita limites seguros (nunca cria loop descontrolado)', () => {
    salvarIntervaloRepeticao(1);
    expect(lerIntervaloRepeticao()).toBe(INTERVALO_REPETICAO_MIN_S);
    salvarIntervaloRepeticao(999999);
    expect(lerIntervaloRepeticao()).toBe(INTERVALO_REPETICAO_MAX_S);
  });
});

describe('reprodução do alerta', () => {
  it('toca pelo menos uma nota quando disparado', () => {
    tocarAlertaSonoro('cozinha', 3);
    vi.advanceTimersByTime(3500);
    expect(osciladoresCriados).toBeGreaterThan(0);
  });

  it('parar o alerta cancela qualquer nota ainda agendada (nunca sobrepõe áudio)', () => {
    tocarAlertaSonoro('discreto', 20);
    pararAlertaSonoro();
    osciladoresCriados = 0;
    vi.advanceTimersByTime(25_000);
    expect(osciladoresCriados).toBe(0);
  });

  it('um novo disparo cancela o ciclo anterior antes de começar o novo', () => {
    tocarAlertaSonoro('discreto', 20);
    osciladoresCriados = 0;
    tocarAlertaSonoro('sino', 1);
    vi.advanceTimersByTime(25_000);
    // Só o ciclo do "sino" (curto) deveria ter tocado — se o "discreto" (longo)
    // não tivesse sido cancelado, teria muito mais notas nesse intervalo.
    expect(osciladoresCriados).toBeLessThan(5);
  });

  it('silenciar não deixa estado que bloqueie um alerta seguinte', () => {
    tocarAlertaSonoro('sino', 5);
    pararAlertaSonoro();
    osciladoresCriados = 0;
    tocarAlertaSonoro('sino', 1);
    vi.advanceTimersByTime(1500);
    expect(osciladoresCriados).toBeGreaterThan(0);
  });
});
