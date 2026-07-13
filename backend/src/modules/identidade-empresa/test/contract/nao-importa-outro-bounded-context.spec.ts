import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { describe, expect, it } from 'vitest';

const MEU_MODULO = 'identidade-empresa';
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
 * Escaneia só o código de produção do módulo (domain/application/infrastructure/api + o
 * `<modulo>.module.ts` na raiz) — `test/` fica de fora de propósito: fixture de teste
 * (ex.: criar Empresa/Categoria direto via repositório de outro módulo para montar cenário)
 * é uma preocupação diferente da que o ADR-0022 protege (o código de produção nunca acessar
 * repositório interno de outro módulo), não uma violação de fronteira.
 */
function listarArquivosDeProducao(raizModulo: string): string[] {
  const arquivos: string[] = [];
  for (const camada of CAMADAS_PRODUCAO) {
    const caminhoCamada = join(raizModulo, camada);
    try {
      arquivos.push(...listarArquivosTs(caminhoCamada));
    } catch {
      // camada pode não existir neste módulo (ex.: módulo façade sem domain/infrastructure)
    }
  }
  const arquivoModulo = join(raizModulo, `${MEU_MODULO}.module.ts`);
  try {
    statSync(arquivoModulo);
    arquivos.push(arquivoModulo);
  } catch {
    // nome de arquivo pode divergir — improvável, mas não quebra o teste por isso
  }
  return arquivos;
}

/**
 * Garante ADR-0022: identidade-empresa só consome outro Bounded Context através da Application
 * Service Interface exportada (application/use-cases/*) — nunca domain/infrastructure/api
 * internos de outro módulo. Resolve o caminho real de cada import relativo (via `path.resolve`)
 * em vez de manipular a string — versão corrigida na Missão 0013; a versão anterior (regex
 * exigindo a substring literal "modules/") nunca detectava nenhuma violação real, e uma
 * segunda tentativa só com string (sem `path.resolve`) gerava falsos positivos em imports
 * legítimos dentro do próprio módulo (ex.: `../dtos/...`, `../ports/...`).
 */
describe('Contrato — identidade-empresa só consome outro Bounded Context via Use Case exportado', () => {
  it('nenhum arquivo de produção importa domain/infrastructure/api de outro módulo', () => {
    const raizModulo = join(__dirname, '..', '..');
    const modulesRoot = resolve(raizModulo, '..');
    const arquivos = listarArquivosDeProducao(raizModulo);

    const violacoes = arquivos.flatMap((arquivo) => {
      const conteudo = readFileSync(arquivo, 'utf-8');
      const imports = [...conteudo.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

      const proibidos = imports.filter((caminhoImportado) => {
        if (!caminhoImportado.startsWith('.')) {
          return false; // não é import relativo (pacote npm etc.)
        }

        const resolvido = resolve(dirname(arquivo), caminhoImportado);
        const relativoAModules = relative(modulesRoot, resolvido);

        if (relativoAModules.startsWith('..')) {
          return false; // fora de src/modules/ (platform/, main.ts) — sempre permitido
        }

        const [primeiroModulo, segunda, terceira] = relativoAModules.split(sep);

        if (primeiroModulo === MEU_MODULO) {
          return false; // mesmo módulo
        }
        if (segunda === `${primeiroModulo}.module`) {
          return false; // import do .module.ts em si — exigido pelo NestJS para compor `imports: [...]`
        }
        return !(segunda === 'application' && terceira === 'use-cases');
      });

      return proibidos.length > 0 ? [{ arquivo, proibidos }] : [];
    });

    expect(violacoes).toEqual([]);
  });
});
