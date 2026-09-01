import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  GrupoEditavel,
  gruposParaPayload,
  OpcaoEditavel,
  validarGrupos,
} from '../../lib/gruposOpcoes';
import { GrupoOpcoesProduto } from '../../types';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface ModeloOpcaoGrupo {
  nome: string;
  precoAdicional?: number;
}

interface ModeloGrupoOpcoes {
  nome: string;
  minEscolhas: number;
  maxEscolhas: number;
  obrigatorio: boolean;
  opcoes: ModeloOpcaoGrupo[];
}

let contadorTemporario = 0;
function idTemporario(): string {
  contadorTemporario += 1;
  return `novo-${contadorTemporario}`;
}
function ehIdTemporario(id: string): boolean {
  return id.startsWith('novo-');
}

function grupoDoServidor(grupo: GrupoOpcoesProduto): GrupoEditavel {
  return {
    id: grupo.id,
    nome: grupo.nome,
    minEscolhas: grupo.minEscolhas,
    maxEscolhas: grupo.maxEscolhas,
    obrigatorio: grupo.obrigatorio,
    ativo: grupo.ativo,
    opcoes: grupo.opcoes.map((opcao) => ({
      id: opcao.id,
      nome: opcao.nome,
      precoAdicional: String(opcao.precoAdicional).replace('.', ','),
      ativo: opcao.ativo,
    })),
  };
}

function grupoDoModelo(modelo: ModeloGrupoOpcoes): GrupoEditavel {
  return {
    id: idTemporario(),
    nome: modelo.nome,
    minEscolhas: modelo.minEscolhas,
    maxEscolhas: modelo.maxEscolhas,
    obrigatorio: modelo.obrigatorio,
    ativo: true,
    opcoes: modelo.opcoes.map((opcao) => ({
      id: idTemporario(),
      nome: opcao.nome,
      precoAdicional: String(opcao.precoAdicional ?? 0).replace('.', ','),
      ativo: true,
    })),
  };
}

function grupoVazio(): GrupoEditavel {
  return {
    id: idTemporario(),
    nome: '',
    minEscolhas: 0,
    maxEscolhas: 1,
    obrigatorio: false,
    ativo: true,
    opcoes: [],
  };
}

interface Props {
  // null enquanto o produto ainda não foi salvo — os grupos ficam num
  // rascunho só local (ver aoMudarGrupos) até o cadastro ser concluído.
  produtoId: string | null;
  outrosProdutos: { id: string; nome: string }[];
  // Avisa o formulário do produto (que não tem acesso aos grupos, carregados
  // só aqui) sempre que "tem pelo menos um grupo ativo agora" muda — usado
  // pra mostrar o aviso de que o mecanismo legado de opções está em espera.
  aoMudarTemGrupoAtivo?: (temGrupoAtivo: boolean) => void;
  // Só relevante durante a criação (produtoId null): avisa o formulário do
  // produto do rascunho atual, pra ele poder incluir no POST /produtos.
  aoMudarGrupos?: (grupos: GrupoEditavel[]) => void;
}

export function GruposOpcoesEditor({
  produtoId,
  outrosProdutos,
  aoMudarTemGrupoAtivo,
  aoMudarGrupos,
}: Props) {
  const [grupos, setGrupos] = useState<GrupoEditavel[] | null>(null);
  const [modelos, setModelos] = useState<ModeloGrupoOpcoes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [grupoCopiandoId, setGrupoCopiandoId] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    // Sem produtoId ainda (produto em criação) não há nada pra buscar — só
    // as sugestões por nicho, que não dependem de um produto existir.
    const gruposPromise = produtoId
      ? api<GrupoOpcoesProduto[]>(`/api/admin/produtos/${produtoId}/grupos-opcoes`, {
          autenticado: true,
        })
      : Promise.resolve<GrupoOpcoesProduto[]>([]);
    const modelosPromise = api<{ segmento: string | null; modelos: ModeloGrupoOpcoes[] }>(
      '/api/admin/modelos-grupos-opcoes',
      { autenticado: true },
    ).catch(() => ({ segmento: null, modelos: [] as ModeloGrupoOpcoes[] }));

    Promise.all([gruposPromise, modelosPromise])
      .then(([gruposResp, modelosResp]) => {
        if (cancelado) return;
        setGrupos(gruposResp.map(grupoDoServidor));
        setModelos(modelosResp.modelos);
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar os grupos de opções deste produto.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [produtoId]);

  useEffect(() => {
    if (!mensagemSucesso) return;
    const timeout = setTimeout(() => setMensagemSucesso(null), 3000);
    return () => clearTimeout(timeout);
  }, [mensagemSucesso]);

  useEffect(() => {
    aoMudarTemGrupoAtivo?.(grupos?.some((grupo) => grupo.ativo) ?? false);
  }, [grupos, aoMudarTemGrupoAtivo]);

  useEffect(() => {
    aoMudarGrupos?.(grupos ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupos]);

  function atualizarGrupo(id: string, patch: Partial<GrupoEditavel>) {
    setGrupos((atuais) => atuais?.map((g) => (g.id === id ? { ...g, ...patch } : g)) ?? null);
  }

  function removerGrupo(id: string) {
    if (!confirm('Remover este grupo de opções?')) return;
    setGrupos((atuais) => atuais?.filter((g) => g.id !== id) ?? null);
  }

  function duplicarGrupo(id: string) {
    setGrupos((atuais) => {
      if (!atuais) return atuais;
      const original = atuais.find((g) => g.id === id);
      if (!original) return atuais;
      const copia: GrupoEditavel = {
        ...original,
        id: idTemporario(),
        nome: `${original.nome} (cópia)`,
        opcoes: original.opcoes.map((op) => ({ ...op, id: idTemporario() })),
      };
      const indice = atuais.findIndex((g) => g.id === id);
      return [...atuais.slice(0, indice + 1), copia, ...atuais.slice(indice + 1)];
    });
  }

  function adicionarOpcao(grupoId: string) {
    atualizarGrupo(grupoId, {
      opcoes: [
        ...(grupos?.find((g) => g.id === grupoId)?.opcoes ?? []),
        { id: idTemporario(), nome: '', precoAdicional: '0', ativo: true },
      ],
    });
  }

  function atualizarOpcao(grupoId: string, opcaoId: string, patch: Partial<OpcaoEditavel>) {
    const grupo = grupos?.find((g) => g.id === grupoId);
    if (!grupo) return;
    atualizarGrupo(grupoId, {
      opcoes: grupo.opcoes.map((op) => (op.id === opcaoId ? { ...op, ...patch } : op)),
    });
  }

  function removerOpcao(grupoId: string, opcaoId: string) {
    const grupo = grupos?.find((g) => g.id === grupoId);
    if (!grupo) return;
    atualizarGrupo(grupoId, { opcoes: grupo.opcoes.filter((op) => op.id !== opcaoId) });
  }

  async function salvar() {
    if (!grupos || !produtoId) return;
    setErro(null);

    const erroValidacao = validarGrupos(grupos);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);
    try {
      const salvos = await api<GrupoOpcoesProduto[]>(
        `/api/admin/produtos/${produtoId}/grupos-opcoes`,
        { method: 'PUT', autenticado: true, body: gruposParaPayload(grupos) },
      );
      setGrupos(salvos.map(grupoDoServidor));
      setMensagemSucesso('Grupos de opções salvos.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar os grupos de opções');
    } finally {
      setSalvando(false);
    }
  }

  async function copiarParaOutroProduto(grupoId: string, produtoDestinoId: string) {
    if (!produtoDestinoId) return;
    setErro(null);
    try {
      await api(`/api/admin/produtos/${produtoId}/grupos-opcoes/${grupoId}/copiar`, {
        method: 'POST',
        autenticado: true,
        body: { produtoDestinoId },
      });
      const nomeDestino = outrosProdutos.find((p) => p.id === produtoDestinoId)?.nome ?? 'produto';
      setMensagemSucesso(`Grupo copiado para "${nomeDestino}".`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao copiar o grupo');
    } finally {
      setGrupoCopiandoId(null);
    }
  }

  if (carregando) {
    return <p className="text-sm text-gray-500">Carregando grupos de opções...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="font-semibold text-gray-800">Grupos de opções</h4>
        <p className="text-xs text-gray-500">
          Ex: Proteínas, Acompanhamentos, Adicionais. O cliente escolhe as opções na hora de pedir.
        </p>
      </div>

      {mensagemSucesso && <Alert tipo="sucesso">{mensagemSucesso}</Alert>}
      {erro && <Alert tipo="erro">{erro}</Alert>}

      {modelos.length > 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-2.5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Sugestões pro seu tipo de negócio
          </p>
          <div className="flex flex-wrap gap-1.5">
            {modelos.map((modelo) => (
              <button
                key={modelo.nome}
                type="button"
                onClick={() => setGrupos((atuais) => [...(atuais ?? []), grupoDoModelo(modelo)])}
                className="rounded-full bg-secondary-light px-2.5 py-1 text-xs font-medium text-secondary-hover transition-colors hover:opacity-90"
              >
                + {modelo.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {grupos?.map((grupo) => (
          <Card key={grupo.id} className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <Input
                value={grupo.nome}
                onChange={(e) => atualizarGrupo(grupo.id, { nome: e.target.value })}
                placeholder="Nome do grupo (ex: Proteínas)"
                className="flex-1"
              />
              <label className="flex shrink-0 items-center gap-1.5 pt-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={grupo.ativo}
                  onChange={(e) => atualizarGrupo(grupo.id, { ativo: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Ativo
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Escolha mínima</label>
                <input
                  type="number"
                  min={0}
                  value={grupo.minEscolhas}
                  onChange={(e) =>
                    atualizarGrupo(grupo.id, { minEscolhas: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Quantas opções o cliente pode escolher?
                </label>
                <input
                  type="number"
                  min={1}
                  value={grupo.maxEscolhas}
                  onChange={(e) =>
                    atualizarGrupo(grupo.id, { maxEscolhas: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={grupo.obrigatorio}
                onChange={(e) => atualizarGrupo(grupo.id, { obrigatorio: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Essa escolha é obrigatória?
            </label>

            <div className="flex flex-col gap-1.5">
              {grupo.opcoes.map((opcao) => (
                <div key={opcao.id} className="flex items-center gap-1.5">
                  <Input
                    value={opcao.nome}
                    onChange={(e) => atualizarOpcao(grupo.id, opcao.id, { nome: e.target.value })}
                    placeholder="Opção (ex: Frango)"
                    className="flex-1"
                  />
                  <div className="flex w-28 shrink-0 items-center gap-1">
                    <span className="text-xs text-gray-500">+R$</span>
                    <input
                      value={opcao.precoAdicional}
                      onChange={(e) =>
                        atualizarOpcao(grupo.id, opcao.id, { precoAdicional: e.target.value })
                      }
                      inputMode="decimal"
                      placeholder="0,00"
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={opcao.ativo}
                      onChange={(e) =>
                        atualizarOpcao(grupo.id, opcao.id, { ativo: e.target.checked })
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    Ativa
                  </label>
                  <button
                    type="button"
                    onClick={() => removerOpcao(grupo.id, opcao.id)}
                    aria-label={`Remover opção ${opcao.nome || ''}`}
                    className="shrink-0 rounded-full px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variante="ghost"
                tamanho="sm"
                onClick={() => adicionarOpcao(grupo.id)}
                className="self-start"
              >
                + Adicionar opção
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
              <Button
                type="button"
                variante="ghost"
                tamanho="sm"
                onClick={() => duplicarGrupo(grupo.id)}
              >
                Duplicar grupo
              </Button>

              {outrosProdutos.length > 0 &&
                (grupoCopiandoId === grupo.id ? (
                  <Select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => copiarParaOutroProduto(grupo.id, e.target.value)}
                    onBlur={() => setGrupoCopiandoId(null)}
                    className="w-56 text-sm"
                  >
                    <option value="" disabled>
                      Copiar pra qual produto?
                    </option>
                    {outrosProdutos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Button
                    type="button"
                    variante="ghost"
                    tamanho="sm"
                    disabled={ehIdTemporario(grupo.id)}
                    title={
                      ehIdTemporario(grupo.id)
                        ? 'Salve os grupos primeiro pra poder copiar'
                        : undefined
                    }
                    onClick={() => setGrupoCopiandoId(grupo.id)}
                  >
                    Copiar para outro produto
                  </Button>
                ))}

              <Button
                type="button"
                variante="ghost-danger"
                tamanho="sm"
                className="ml-auto"
                onClick={() => removerGrupo(grupo.id)}
              >
                Remover grupo
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variante="secondary"
          tamanho="sm"
          onClick={() => setGrupos((atuais) => [...(atuais ?? []), grupoVazio()])}
        >
          + Novo grupo
        </Button>
        {produtoId ? (
          <Button type="button" tamanho="sm" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar grupos de opções'}
          </Button>
        ) : (
          (grupos?.length ?? 0) > 0 && (
            <span className="text-xs text-gray-500">
              Esses grupos serão salvos junto com o produto, no botão "Salvar" abaixo.
            </span>
          )
        )}
      </div>
    </div>
  );
}
