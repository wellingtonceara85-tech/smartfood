import assert from 'node:assert/strict';
import { test } from 'node:test';
import { montarEmailRecuperacaoSenha } from './emailRecuperacaoSenha';

test('assunto é exatamente o sugerido na missão', () => {
  const email = montarEmailRecuperacaoSenha({ nome: 'Edillene', link: 'https://x/y' });
  assert.equal(email.assunto, 'Redefina sua senha do SmartFood');
});

test('avisa que o link expira em 1 hora, no html e no texto', () => {
  const email = montarEmailRecuperacaoSenha({ nome: 'Edillene', link: 'https://x/y' });
  assert.match(email.html, /1 hora/);
  assert.match(email.texto, /1 hora/);
});

test('avisa que quem não solicitou pode ignorar, no html e no texto', () => {
  const email = montarEmailRecuperacaoSenha({ nome: 'Edillene', link: 'https://x/y' });
  assert.match(email.html, /pode ignorar/);
  assert.match(email.texto, /pode ignorar/);
});

test('inclui o link de redefinição em ambos os formatos', () => {
  const link = 'https://smartfood.app/redefinir-senha?token=abc123';
  const email = montarEmailRecuperacaoSenha({ nome: 'Edillene', link });
  assert.ok(email.html.includes(link));
  assert.ok(email.texto.includes(link));
});

test('nunca menciona senha, hash ou token cru fora do link — só o texto do aviso', () => {
  const email = montarEmailRecuperacaoSenha({ nome: 'Edillene', link: 'https://x/y?token=abc' });
  // "senha" só deve aparecer nas frases de aviso, nunca como um valor.
  assert.equal(/senhaHash|hash da senha/i.test(email.html), false);
  assert.equal(/senhaHash|hash da senha/i.test(email.texto), false);
});

test('escapa HTML no nome (evita injeção se o nome cadastrado tiver caracteres especiais)', () => {
  const email = montarEmailRecuperacaoSenha({
    nome: '<script>alert(1)</script>',
    link: 'https://x',
  });
  assert.equal(email.html.includes('<script>alert(1)</script>'), false);
  assert.ok(email.html.includes('&lt;script&gt;'));
});

test('nome aparece no texto plano sem qualquer transformação', () => {
  const email = montarEmailRecuperacaoSenha({ nome: 'Edillene Alexandre', link: 'https://x' });
  assert.ok(email.texto.includes('Olá, Edillene Alexandre.'));
});
