import assert from 'node:assert/strict';
import { test } from 'node:test';
import { montarPendenciasLoja, produtoIncompleto } from './pendenciasLoja';

const lojaCompleta = {
  produtos: [{ fotoUrl: 'https://x/foto.jpg', descricao: 'Descrição completa' }],
  horarioAbertura: '08:00',
  horarioFechamento: '18:00',
  abertoManual: null,
  logoUrl: 'https://x/logo.jpg',
  endereco: 'Rua Exemplo, 123',
};

test('loja recém-criada (tudo em branco, sem produtos) gera pendência de horário e de dados essenciais, mas não de produtos', () => {
  const pendencias = montarPendenciasLoja({
    produtos: [],
    horarioAbertura: null,
    horarioFechamento: null,
    abertoManual: null,
    logoUrl: null,
    endereco: null,
  });

  const chaves = pendencias.map((p) => p.chave);
  assert.deepEqual(chaves, ['horario_funcionamento', 'dados_essenciais']);
});

test('loja com tudo configurado e produtos completos não gera nenhuma pendência', () => {
  assert.deepEqual(montarPendenciasLoja(lojaCompleta), []);
});

test('status manual definido (forçar aberto/fechado) dispensa a pendência de horário, mesmo sem horário cadastrado', () => {
  const semHorarioComManualAberto = montarPendenciasLoja({
    ...lojaCompleta,
    horarioAbertura: null,
    horarioFechamento: null,
    abertoManual: true,
  });
  assert.equal(
    semHorarioComManualAberto.some((p) => p.chave === 'horario_funcionamento'),
    false,
  );

  const semHorarioComManualFechado = montarPendenciasLoja({
    ...lojaCompleta,
    horarioAbertura: null,
    horarioFechamento: null,
    abertoManual: false,
  });
  assert.equal(
    semHorarioComManualFechado.some((p) => p.chave === 'horario_funcionamento'),
    false,
  );
});

test('agenda semanal configurada dispensa a pendência de horário, mesmo sem os campos legados', () => {
  const pendencias = montarPendenciasLoja({
    ...lojaCompleta,
    horarioAbertura: null,
    horarioFechamento: null,
    horariosFuncionamento: [
      { diaSemana: 1, ativo: true, faixas: [{ abertura: '08:00', fechamento: '18:00' }] },
    ],
  });
  assert.equal(
    pendencias.some((p) => p.chave === 'horario_funcionamento'),
    false,
  );
});

test('falta só o horário de fechamento (abertura preenchida) ainda conta como pendência', () => {
  const pendencias = montarPendenciasLoja({
    ...lojaCompleta,
    horarioAbertura: '08:00',
    horarioFechamento: null,
  });
  assert.ok(pendencias.some((p) => p.chave === 'horario_funcionamento'));
});

test('produto com descrição vazia ou só espaços em branco conta como incompleto', () => {
  assert.equal(produtoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: '' }), true);
  assert.equal(produtoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: '   ' }), true);
  assert.equal(produtoIncompleto({ fotoUrl: null, descricao: 'Descrição ok' }), true);
  assert.equal(
    produtoIncompleto({ fotoUrl: 'https://x/foto.jpg', descricao: 'Descrição ok' }),
    false,
  );
});

test('conta produtos incompletos e usa singular/plural no título', () => {
  const umIncompleto = montarPendenciasLoja({
    ...lojaCompleta,
    produtos: [
      { fotoUrl: 'https://x/foto.jpg', descricao: 'ok' },
      { fotoUrl: null, descricao: 'ok' },
    ],
  });
  const pendenciaProdutos = umIncompleto.find((p) => p.chave === 'produtos_incompletos');
  assert.equal(pendenciaProdutos?.titulo, '1 produto sem foto ou descrição');

  const doisIncompletos = montarPendenciasLoja({
    ...lojaCompleta,
    produtos: [
      { fotoUrl: null, descricao: 'ok' },
      { fotoUrl: 'https://x/foto.jpg', descricao: null },
    ],
  });
  const pendenciaDois = doisIncompletos.find((p) => p.chave === 'produtos_incompletos');
  assert.equal(pendenciaDois?.titulo, '2 produtos sem foto ou descrição');
});

test('cores, agendamento e outros campos com default no schema nunca geram pendência', () => {
  // montarPendenciasLoja nem recebe esses campos — este teste documenta a
  // decisão de design: só campos nullable-sem-default entram na função.
  const pendencias = montarPendenciasLoja(lojaCompleta);
  assert.deepEqual(pendencias, []);
});

test('falta só a logo (endereço preenchido) especifica no título', () => {
  const pendencias = montarPendenciasLoja({ ...lojaCompleta, logoUrl: null });
  const pendenciaEssenciais = pendencias.find((p) => p.chave === 'dados_essenciais');
  assert.equal(pendenciaEssenciais?.titulo, 'Adicione a logo da sua loja');
});

test('falta só o endereço (logo preenchida) especifica no título', () => {
  const pendencias = montarPendenciasLoja({ ...lojaCompleta, endereco: null });
  const pendenciaEssenciais = pendencias.find((p) => p.chave === 'dados_essenciais');
  assert.equal(pendenciaEssenciais?.titulo, 'Adicione o endereço da sua loja');
});

test('faltando logo e endereço juntos, título menciona os dois', () => {
  const pendencias = montarPendenciasLoja({ ...lojaCompleta, logoUrl: null, endereco: null });
  const pendenciaEssenciais = pendencias.find((p) => p.chave === 'dados_essenciais');
  assert.equal(pendenciaEssenciais?.titulo, 'Adicione a logo e o endereço da sua loja');
});
