import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calcularAberto,
  DiaHorarioFuncionamento,
  dentroDoHorarioSemanal,
  HorariosFuncionamento,
  validarHorariosFuncionamento,
} from './horario';

// America/Fortaleza é UTC-3 fixo (sem horário de verão). Os horários UTC nos
// comentários abaixo mostram o instante convertido pro horário local da loja
// — é isso que calcularAberto precisa acertar mesmo rodando num processo em UTC.

test('abertoManual sempre vence, independente do horário', () => {
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: false };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T13:19:00Z')), false); // 10:19 local, dentro do horário
});

test('sem horário cadastrado, considera sempre aberto', () => {
  const loja = { horarioAbertura: null, horarioFechamento: null, abertoManual: null };
  assert.equal(calcularAberto(loja), true);
});

test('usa o fuso da loja, não o fuso do processo — reproduz o bug de produção', () => {
  // 2026-08-04T00:19:00Z = 03/08 21:19 em America/Fortaleza.
  // Com Date.getHours() (fuso do processo, UTC em produção) isso lia como
  // 00:19 e marcava a loja como fechada mesmo estando aberta às 21:19 local.
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-04T00:19:00Z')), true);
});

test('fechada antes do horário de abertura (fuso local)', () => {
  // 2026-08-03T12:00:00Z = 09:00 em America/Fortaleza — antes de abrir às 10:00.
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T12:00:00Z')), false);
});

test('fechada depois do horário de fechamento (fuso local)', () => {
  // 2026-08-04T02:30:00Z = 03/08 23:30 em America/Fortaleza — já fechou às 23:00.
  const loja = { horarioAbertura: '10:00', horarioFechamento: '23:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-04T02:30:00Z')), false);
});

test('horário atravessando meia-noite: aberta de madrugada (fuso local)', () => {
  // 2026-08-03T04:00:00Z = 01:00 em America/Fortaleza — dentro de 18:00–02:00.
  const loja = { horarioAbertura: '18:00', horarioFechamento: '02:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T04:00:00Z')), true);
});

test('abertura igual ao fechamento é tratado como 24h', () => {
  const loja = { horarioAbertura: '00:00', horarioFechamento: '00:00', abertoManual: null };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T12:00:00Z')), true);
});

test('loja antiga (sem horariosFuncionamento) continua usando os campos legados, sem mudança de comportamento', () => {
  const loja = {
    horarioAbertura: '10:00',
    horarioFechamento: '23:00',
    abertoManual: null,
    horariosFuncionamento: null,
  };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T15:00:00Z')), true); // 12:00 local
  assert.equal(calcularAberto(loja, new Date('2026-08-03T12:00:00Z')), false); // 09:00 local
});

// --- Agenda semanal ---
// 2026-08-03 = segunda, 2026-08-07 = sexta, 2026-08-08 = sábado, 2026-08-09 = domingo (America/Fortaleza).

function diaFechado(diaSemana: number): DiaHorarioFuncionamento {
  return { diaSemana, ativo: false, faixas: [] };
}

function diaAberto(
  diaSemana: number,
  faixas: { abertura: string; fechamento: string }[],
): DiaHorarioFuncionamento {
  return { diaSemana, ativo: true, faixas };
}

/** Semana toda fechada por padrão — os testes sobrescrevem só o(s) dia(s) que importam pro cenário. */
function semanaBase(overrides: Record<number, DiaHorarioFuncionamento>): HorariosFuncionamento {
  const semana: DiaHorarioFuncionamento[] = [];
  for (let dia = 0; dia <= 6; dia += 1) {
    semana.push(overrides[dia] ?? diaFechado(dia));
  }
  return semana;
}

test('agenda semanal: dia aberto dentro do horário (1º período)', () => {
  const horarios = semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '14:00' },
      { abertura: '18:00', fechamento: '23:00' },
    ]),
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-03T15:00:00Z')), true); // segunda 12:00
});

test('agenda semanal: antes da abertura', () => {
  const horarios = semanaBase({
    1: diaAberto(1, [{ abertura: '11:00', fechamento: '14:00' }]),
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-03T12:00:00Z')), false); // segunda 09:00
});

test('agenda semanal: entre dois períodos do mesmo dia', () => {
  const horarios = semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '14:00' },
      { abertura: '18:00', fechamento: '23:00' },
    ]),
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-03T18:00:00Z')), false); // segunda 15:00
});

test('agenda semanal: dentro do 2º período', () => {
  const horarios = semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '14:00' },
      { abertura: '18:00', fechamento: '23:00' },
    ]),
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-03T23:00:00Z')), true); // segunda 20:00
});

test('agenda semanal: depois do fechamento (último período do dia)', () => {
  const horarios = semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '14:00' },
      { abertura: '18:00', fechamento: '23:00' },
    ]),
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-04T02:30:00Z')), false); // segunda 23:30
});

test('agenda semanal: dia marcado como fechado — fechada o dia todo', () => {
  // Domingo fechado, sábado sem faixa nenhuma (não atravessa a meia-noite) — sem spillover possível.
  const horarios = semanaBase({ 6: diaFechado(6), 0: diaFechado(0) });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-09T13:00:00Z')), false); // domingo 10:00
});

test('agenda semanal: horário atravessando a meia-noite (sexta 18:00–02:00)', () => {
  const horarios = semanaBase({ 5: diaAberto(5, [{ abertura: '18:00', fechamento: '02:00' }]) });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-07T23:00:00Z')), true); // sexta 20:00
});

test('agenda semanal: madrugada de sábado ainda pertence ao expediente iniciado na sexta', () => {
  const horarios = semanaBase({
    5: diaAberto(5, [{ abertura: '18:00', fechamento: '02:00' }]),
    6: diaFechado(6), // sábado marcado como fechado — não deveria importar aqui
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-08T04:00:00Z')), true); // sábado 01:00 — ainda expediente de sexta
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-08T13:00:00Z')), false); // sábado 10:00 — sábado é fechado, expediente de sexta já acabou às 02:00
});

test('agenda semanal: domingo fechado continua fechado mesmo com sábado tendo expediente que atravessa a meia-noite', () => {
  const horarios = semanaBase({
    6: diaAberto(6, [{ abertura: '18:00', fechamento: '02:00' }]),
    0: diaFechado(0),
  });
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-09T04:00:00Z')), true); // domingo 01:00 — spillover de sábado
  assert.equal(dentroDoHorarioSemanal(horarios, new Date('2026-08-09T13:00:00Z')), false); // domingo 10:00 — domingo fechado, sem expediente próprio
});

test('agenda semanal: calcularAberto "Forçar aberto" sobrepõe a agenda inteira', () => {
  const loja = {
    horarioAbertura: null,
    horarioFechamento: null,
    abertoManual: true,
    horariosFuncionamento: semanaBase({ 0: diaFechado(0) }),
  };
  assert.equal(calcularAberto(loja, new Date('2026-08-09T13:00:00Z')), true); // domingo, fechado na agenda, mas forçado aberto
});

test('agenda semanal: calcularAberto "Forçar fechado" sobrepõe a agenda inteira', () => {
  const loja = {
    horarioAbertura: null,
    horarioFechamento: null,
    abertoManual: false,
    horariosFuncionamento: semanaBase({
      1: diaAberto(1, [{ abertura: '00:00', fechamento: '23:59' }]),
    }),
  };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T15:00:00Z')), false); // segunda 12:00, aberta na agenda, mas forçado fechado
});

test('agenda semanal: calcularAberto usa a agenda quando presente, mesmo com campos legados preenchidos', () => {
  const loja = {
    horarioAbertura: '00:00',
    horarioFechamento: '23:59', // legado diria "sempre aberto"
    abertoManual: null,
    horariosFuncionamento: semanaBase({ 1: diaFechado(1) }), // agenda diz segunda fechada
  };
  assert.equal(calcularAberto(loja, new Date('2026-08-03T15:00:00Z')), false); // segunda 12:00
});

// --- validarHorariosFuncionamento ---

function agendaValida(): HorariosFuncionamento {
  return semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '14:00' },
      { abertura: '18:00', fechamento: '23:00' },
    ]),
    5: diaAberto(5, [{ abertura: '18:00', fechamento: '02:00' }]),
  });
}

test('validarHorariosFuncionamento: agenda válida com múltiplos períodos', () => {
  assert.equal(validarHorariosFuncionamento(agendaValida()).valido, true);
});

test('validarHorariosFuncionamento: rejeita agenda com menos de 7 dias', () => {
  const agenda = agendaValida().slice(0, 6);
  const resultado = validarHorariosFuncionamento(agenda);
  assert.equal(resultado.valido, false);
});

test('validarHorariosFuncionamento: rejeita dia duplicado', () => {
  const agenda = agendaValida();
  agenda[1] = { ...agenda[0], diaSemana: agenda[0].diaSemana }; // duplica o domingo
  const resultado = validarHorariosFuncionamento(agenda);
  assert.equal(resultado.valido, false);
});

test('validarHorariosFuncionamento: dia ativo sem nenhuma faixa é inválido', () => {
  const agenda = semanaBase({ 1: { diaSemana: 1, ativo: true, faixas: [] } });
  assert.equal(validarHorariosFuncionamento(agenda).valido, false);
});

test('validarHorariosFuncionamento: dia inativo com faixa cadastrada é inválido', () => {
  const agenda = semanaBase({
    1: { diaSemana: 1, ativo: false, faixas: [{ abertura: '10:00', fechamento: '18:00' }] },
  });
  assert.equal(validarHorariosFuncionamento(agenda).valido, false);
});

test('validarHorariosFuncionamento: rejeita horário fora do formato HH:mm', () => {
  const agenda = semanaBase({
    1: diaAberto(1, [{ abertura: '25:00', fechamento: '18:00' }]),
  });
  assert.equal(validarHorariosFuncionamento(agenda).valido, false);
});

test('validarHorariosFuncionamento: rejeita abertura igual ao fechamento', () => {
  const agenda = semanaBase({
    1: diaAberto(1, [{ abertura: '10:00', fechamento: '10:00' }]),
  });
  assert.equal(validarHorariosFuncionamento(agenda).valido, false);
});

test('validarHorariosFuncionamento: rejeita faixas sobrepostas no mesmo dia', () => {
  const agenda = semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '15:00' },
      { abertura: '14:00', fechamento: '18:00' },
    ]),
  });
  assert.equal(validarHorariosFuncionamento(agenda).valido, false);
});

test('validarHorariosFuncionamento: aceita faixas adjacentes (sem sobreposição real)', () => {
  const agenda = semanaBase({
    1: diaAberto(1, [
      { abertura: '11:00', fechamento: '14:00' },
      { abertura: '14:00', fechamento: '18:00' },
    ]),
  });
  assert.equal(validarHorariosFuncionamento(agenda).valido, true);
});
