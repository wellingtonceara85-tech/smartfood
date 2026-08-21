import assert from 'node:assert/strict';
import { test } from 'node:test';
import { montarOnboarding } from './onboarding';

test('montarOnboarding com loja nova (nada concluído)', () => {
  const etapas = montarOnboarding({
    contaAtivada: false,
    primeiroAcesso: false,
    totalProdutos: 0,
    totalPedidos: 0,
  });
  assert.equal(
    etapas.every((e) => !e.concluida),
    true,
  );
});

test('montarOnboarding reflete progresso parcial (ativada e com produtos, sem pedido)', () => {
  const etapas = montarOnboarding({
    contaAtivada: true,
    primeiroAcesso: true,
    totalProdutos: 3,
    totalPedidos: 0,
  });
  const porChave = Object.fromEntries(etapas.map((e) => [e.chave, e.concluida]));
  assert.equal(porChave.conta_ativada, true);
  assert.equal(porChave.primeiro_acesso, true);
  assert.equal(porChave.produtos_cadastrados, true);
  assert.equal(porChave.primeiro_pedido, false);
});

test('montarOnboarding com tudo concluído', () => {
  const etapas = montarOnboarding({
    contaAtivada: true,
    primeiroAcesso: true,
    totalProdutos: 5,
    totalPedidos: 2,
  });
  assert.equal(
    etapas.every((e) => e.concluida),
    true,
  );
});
