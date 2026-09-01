import assert from 'node:assert/strict';
import { test } from 'node:test';
import { modelosGruposParaSegmento } from './modelosGrupoOpcoes';
import { SEGMENTOS_LOJA } from './segmentoLoja';

test('todo segmento de marmitaria/refeições sugere um grupo de Proteínas obrigatório', () => {
  const modelos = modelosGruposParaSegmento('marmitas_refeicoes');
  const proteinas = modelos.find((m) => m.nome === 'Proteínas');
  assert.ok(proteinas);
  assert.equal(proteinas?.obrigatorio, true);
  assert.ok(proteinas!.opcoes.length > 0);
});

test('segmento sem modelo cadastrado devolve lista vazia, nunca erro', () => {
  assert.deepEqual(modelosGruposParaSegmento('bebidas'), []);
  assert.deepEqual(modelosGruposParaSegmento('segmento-inexistente'), []);
});

test('modelos nunca têm opção com preço negativo', () => {
  for (const segmento of SEGMENTOS_LOJA) {
    for (const grupo of modelosGruposParaSegmento(segmento.chave)) {
      for (const opcao of grupo.opcoes) {
        assert.ok(
          (opcao.precoAdicional ?? 0) >= 0,
          `${segmento.chave}/${grupo.nome}/${opcao.nome}`,
        );
      }
    }
  }
});
