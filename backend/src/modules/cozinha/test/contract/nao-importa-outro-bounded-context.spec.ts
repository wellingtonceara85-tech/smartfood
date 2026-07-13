import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { describe, expect, it } from 'vitest';

const MEU_MODULO = 'cozinha';
const CAMADAS_PRODUCAO = ['domain', 'application', 'infrastructure', 'api'];

function listarArquivosTs(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const caminho = join(dir, entrada);
    return statSync(caminho).isDirectory()
      ? listarArquivosTs(caminho)
      : caminho.endsWith('.ts')
        ? [caminho]
        : [];
  });
}

/**
 * Escaneia só o código de produção do módulo — `test/` fica de fora de propósito (ver
 * identidade-empresa/test/contract). Cozinha não tem `domain/`/`infrastructure/` (módulo
 * façade, Missão 0013, Seção 6) — as camadas ausentes só não contribuem arquivo nenhum.
 */
function listarArquivosDeProducao(raizModulo: string): string[] {
  const arquivos: string[] = [];
  for (const camada of CAMADAS_PRODUCAO) {
    const caminhoCamada = join(raizModulo, camada);
    try {
      arquivos.push(...listarArquivosTs(caminhoCamada));
    } catch {
      // camada pode não existir neste módulo (esperado para domain/infrastructure aqui)
    }
  }
  const arquivoModulo = join(raizModulo, `${MEU_MODULO}.module.ts`);
  try {
    statSync(arquivoModulo);
    arquivos.push(arquivoModulo);
  } catch {
    // nome de arquivo pode divergir
  }
  return arquivos;
}

/**
 * Garante ADR-0022: cozinha só consome Pedidos através da Application Service Interface
 * exportada (application/use-cases/*) — nunca domain/infrastructure/api de Pedidos. Reforça
 * a Missão 0013, Seção 6: cozinha nunca deve importar `PedidoRepository` nem a entidade
 * `Pedido` diretamente.
 */
describe('Contrato — cozinha só consome outro Bounded Context via Use Case exportado', () => {
  it('nenhum arquivo de produção importa domain/infrastructure/api de outro módulo', () => {
    const raizModulo = join(__dirname, '..', '..');
    const modulesRoot = resolve(raizModulo, '..');
    const arquivos = listarArquivosDeProducao(raizModulo);

    const violacoes = arquivos.flatMap((arquivo) => {
      const conteudo = readFileSync(arquivo, 'utf-8');
      const imports = [...conteudo.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

      const proibidos = imports.filter((caminhoImportado) => {
        if (!caminhoImportado.startsWith('.')) {
          return false;
        }

        const resolvido = resolve(dirname(arquivo), caminhoImportado);
        const relativoAModules = relative(modulesRoot, resolvido);

        if (relativoAModules.startsWith('..')) {
          return false;
        }

        const [primeiroModulo, segunda, terceira] = relativoAModules.split(sep);

        if (primeiroModulo === MEU_MODULO) {
          return false;
        }
        if (segunda === `${primeiroModulo}.module`) {
          return false;
        }
        return !(segunda === 'application' && terceira === 'use-cases');
      });

      return proibidos.length > 0 ? [{ arquivo, proibidos }] : [];
    });

    expect(violacoes).toEqual([]);
  });
});
