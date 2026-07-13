import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { describe, expect, it } from 'vitest';

const MEU_MODULO = 'pedidos';
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
 * identidade-empresa/test/contract para a explicação completa).
 */
function listarArquivosDeProducao(raizModulo: string): string[] {
  const arquivos: string[] = [];
  for (const camada of CAMADAS_PRODUCAO) {
    const caminhoCamada = join(raizModulo, camada);
    try {
      arquivos.push(...listarArquivosTs(caminhoCamada));
    } catch {
      // camada pode não existir neste módulo
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
 * Garante ADR-0022: pedidos só consome outro Bounded Context através da Application Service
 * Interface exportada (application/use-cases/*) — nunca domain/infrastructure/api internos de
 * outro módulo. pedidos consome `BuscarProdutoParaPedidoUseCase` de catalogo de propósito
 * (Missão 0012). Ver identidade-empresa/test/contract para o histórico da correção (Missão 0013).
 */
describe('Contrato — pedidos só consome outro Bounded Context via Use Case exportado', () => {
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
