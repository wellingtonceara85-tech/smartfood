/**
 * Estado local (editável) de grupos de opções, compartilhado entre
 * GruposOpcoesEditor (produto já existente ou em criação) e o formulário de
 * produto (que precisa enviar o rascunho junto no POST /produtos quando o
 * lojista já configura grupos durante o cadastro — ver Missão "Grupos de
 * opções — UX de criação").
 */
export interface OpcaoEditavel {
  id: string;
  nome: string;
  precoAdicional: string;
  ativo: boolean;
}

export interface GrupoEditavel {
  id: string;
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  ativo: boolean;
  opcoes: OpcaoEditavel[];
}

/**
 * Validação client-side (mesma regra do backend) — usada tanto pelo botão
 * "Salvar grupos de opções" de um produto já existente quanto pelo fluxo de
 * criação, que envia os grupos junto no POST /produtos e precisa do mesmo
 * feedback claro antes de sequer chamar a API.
 */
export function validarGrupos(grupos: GrupoEditavel[]): string | null {
  for (const grupo of grupos) {
    if (!grupo.nome.trim()) {
      return 'Todo grupo precisa de um nome.';
    }
    if (grupo.maxEscolhas < 1) {
      return `"${grupo.nome}": a quantidade máxima de escolhas precisa ser pelo menos 1.`;
    }
    if (grupo.minEscolhas > grupo.maxEscolhas) {
      return `"${grupo.nome}": a escolha mínima não pode ser maior que a máxima.`;
    }
    for (const opcao of grupo.opcoes) {
      if (!opcao.nome.trim()) {
        return `"${grupo.nome}": toda opção precisa de um nome.`;
      }
      if (Number.isNaN(Number(opcao.precoAdicional.replace(',', '.')))) {
        return `"${grupo.nome}": valor adicional inválido em "${opcao.nome}".`;
      }
    }
  }
  return null;
}

/** Converte o estado local (editável, preço como texto) pro formato que a API espera. Assume que validarGrupos já passou. */
export function gruposParaPayload(grupos: GrupoEditavel[]) {
  return {
    grupos: grupos.map((grupo, indiceGrupo) => ({
      nome: grupo.nome.trim(),
      minEscolhas: grupo.minEscolhas,
      maxEscolhas: grupo.maxEscolhas,
      obrigatorio: grupo.obrigatorio,
      ativo: grupo.ativo,
      ordem: indiceGrupo,
      opcoes: grupo.opcoes.map((opcao, indiceOpcao) => ({
        nome: opcao.nome.trim(),
        precoAdicional: Number(opcao.precoAdicional.replace(',', '.')) || 0,
        ativo: opcao.ativo,
        ordem: indiceOpcao,
      })),
    })),
  };
}

/**
 * Corpo enviado ao criar/atualizar um produto — sempre inclui o estado atual
 * dos grupos, seja criando (produto novo, grupos ainda só locais) ou editando
 * (produto existente, grupos já persistidos). Ponto único usado pelos dois
 * envios do formulário de produto (POST e PUT) — nenhum dos dois pode "só
 * mandar metade" dos dados de novo, o que foi exatamente o bug relatado na
 * homologação: o "Salvar" da edição só mandava os campos básicos do
 * produto, então uma mudança feita nos grupos (e não salva pelo botão
 * separado "Salvar grupos de opções") sumia silenciosamente ao reabrir.
 */
export function corpoProdutoComGrupos<T extends object>(
  corpoBase: T,
  gruposRascunho: GrupoEditavel[],
): T & ReturnType<typeof gruposParaPayload> {
  return { ...corpoBase, ...gruposParaPayload(gruposRascunho) };
}
