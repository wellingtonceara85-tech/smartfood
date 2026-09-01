import { useState } from 'react';
import { deveUsarOpcoesLegado, rotuloRegraEscolha } from '../lib/produto';
import { GrupoSelecionadoCarrinho, Produto } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';

interface ValoresIniciais {
  opcao: string | null;
  gruposSelecionados: GrupoSelecionadoCarrinho[];
  quantidade: number;
  observacao: string | null;
}

interface Props {
  produto: Produto;
  aoFechar: () => void;
  aoAdicionar: (
    produto: Produto,
    opcao: string | null,
    gruposSelecionados: GrupoSelecionadoCarrinho[],
    quantidade: number,
    observacao: string | null,
  ) => void;
  valoresIniciais?: ValoresIniciais;
  modoEdicao?: boolean;
}

/** grupoId -> lista de opcaoId selecionados nesse grupo (ordem de clique, útil pro rádio). */
type SelecoesPorGrupo = Record<string, string[]>;

function selecoesIniciais(
  gruposSelecionados: GrupoSelecionadoCarrinho[] | undefined,
): SelecoesPorGrupo {
  const selecoes: SelecoesPorGrupo = {};
  for (const grupo of gruposSelecionados ?? []) {
    selecoes[grupo.grupoId] = grupo.opcoes.map((o) => o.id);
  }
  return selecoes;
}

const moeda = (valor: number) => `R$ ${valor.toFixed(2)}`;

export function ModalProduto({
  produto,
  aoFechar,
  aoAdicionar,
  valoresIniciais,
  modoEdicao,
}: Props) {
  // As duas formas de personalização nunca aparecem juntas pro cliente — ver
  // deveUsarOpcoesLegado em lib/produto.ts. Enquanto o produto tiver grupo
  // ativo, o mecanismo legado fica em espera (nem exibido, nem enviado no
  // pedido), mesmo que o produto ainda tenha Produto.opcoes cadastrado.
  const usarOpcoesLegado = deveUsarOpcoesLegado(produto);

  const [opcao, setOpcao] = useState(
    valoresIniciais?.opcao ?? (usarOpcoesLegado ? (produto.opcoes?.[0] ?? '') : ''),
  );
  const [selecoes, setSelecoes] = useState<SelecoesPorGrupo>(
    selecoesIniciais(valoresIniciais?.gruposSelecionados),
  );
  const [quantidade, setQuantidade] = useState(valoresIniciais?.quantidade ?? 1);
  const [observacao, setObservacao] = useState(valoresIniciais?.observacao ?? '');
  const [tentouConfirmar, setTentouConfirmar] = useState(false);

  const gruposAtivos = (produto.gruposOpcoes ?? [])
    .filter((grupo) => grupo.ativo)
    .slice()
    .sort((a, b) => a.ordem - b.ordem);

  function alternarOpcaoUnica(grupoId: string, opcaoId: string, obrigatorio: boolean) {
    setSelecoes((atual) => {
      const jaSelecionada = atual[grupoId]?.[0] === opcaoId;
      if (jaSelecionada && !obrigatorio) {
        const copia = { ...atual };
        delete copia[grupoId];
        return copia;
      }
      return { ...atual, [grupoId]: [opcaoId] };
    });
  }

  function alternarOpcaoMultipla(grupoId: string, opcaoId: string, maxEscolhas: number) {
    setSelecoes((atual) => {
      const atuais = atual[grupoId] ?? [];
      if (atuais.includes(opcaoId)) {
        return { ...atual, [grupoId]: atuais.filter((id) => id !== opcaoId) };
      }
      if (atuais.length >= maxEscolhas) return atual;
      return { ...atual, [grupoId]: [...atuais, opcaoId] };
    });
  }

  function contagemInvalida(grupo: (typeof gruposAtivos)[number]): string | null {
    const quantidadeEscolhida = selecoes[grupo.id]?.length ?? 0;
    if ((grupo.obrigatorio || grupo.minEscolhas > 0) && quantidadeEscolhida === 0) {
      return 'Escolha uma opção pra continuar.';
    }
    if (quantidadeEscolhida < grupo.minEscolhas) {
      return `Escolha pelo menos ${grupo.minEscolhas} opções.`;
    }
    if (quantidadeEscolhida > grupo.maxEscolhas) {
      return `Escolha no máximo ${grupo.maxEscolhas} opções.`;
    }
    return null;
  }

  const errosPorGrupo = new Map(
    gruposAtivos
      .map((grupo) => [grupo.id, contagemInvalida(grupo)] as const)
      .filter(([, erro]) => erro !== null),
  );
  const formularioValido = errosPorGrupo.size === 0;

  const adicionalTotal = gruposAtivos.reduce((soma, grupo) => {
    const idsEscolhidos = selecoes[grupo.id] ?? [];
    return (
      soma +
      grupo.opcoes
        .filter((op) => idsEscolhidos.includes(op.id))
        .reduce((s, op) => s + op.precoAdicional, 0)
    );
  }, 0);

  const total = (produto.preco + adicionalTotal) * quantidade;

  function montarGruposSelecionados(): GrupoSelecionadoCarrinho[] {
    return gruposAtivos
      .map((grupo) => {
        const idsEscolhidos = selecoes[grupo.id] ?? [];
        const opcoes = grupo.opcoes
          .filter((op) => idsEscolhidos.includes(op.id))
          .map((op) => ({ id: op.id, nome: op.nome, precoAdicional: op.precoAdicional }));
        return { grupoId: grupo.id, grupoNome: grupo.nome, opcoes };
      })
      .filter((grupo) => grupo.opcoes.length > 0);
  }

  function aoConfirmar() {
    if (!formularioValido) {
      setTentouConfirmar(true);
      return;
    }
    aoAdicionar(
      produto,
      usarOpcoesLegado ? opcao || null : null,
      montarGruposSelecionados(),
      quantidade,
      observacao.trim() || null,
    );
    aoFechar();
  }

  return (
    <Modal titulo="" aoFechar={aoFechar}>
      {produto.fotoUrl ? (
        <img
          src={produto.fotoUrl}
          alt={produto.nome}
          className="-mt-3 aspect-[4/3] w-full rounded-lg object-cover"
        />
      ) : (
        <div className="-mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-gray-100 text-gray-300">
          <span aria-hidden="true" className="text-4xl">
            🍽️
          </span>
        </div>
      )}

      <h2 className="mt-3 text-lg font-bold text-gray-800">{produto.nome}</h2>
      {produto.descricao && <p className="mt-1 text-sm text-gray-500">{produto.descricao}</p>}
      <p className="mt-2 text-base font-bold text-primary-hover">R$ {produto.preco.toFixed(2)}</p>

      {usarOpcoesLegado && (
        <div className="mt-4">
          <label
            htmlFor="opcao-produto"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Opções
          </label>
          <Select id="opcao-produto" value={opcao} onChange={(e) => setOpcao(e.target.value)}>
            {(produto.opcoes ?? []).map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </Select>
        </div>
      )}

      {gruposAtivos.map((grupo) => {
        const opcoesAtivas = grupo.opcoes
          .filter((op) => op.ativo)
          .sort((a, b) => a.ordem - b.ordem);
        const idsEscolhidos = selecoes[grupo.id] ?? [];
        const escolhaUnica = grupo.maxEscolhas <= 1;
        const limiteAtingido = idsEscolhidos.length >= grupo.maxEscolhas;
        const erro = tentouConfirmar ? errosPorGrupo.get(grupo.id) : undefined;

        return (
          <fieldset key={grupo.id} className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <legend className="text-sm font-semibold text-gray-800">{grupo.nome}</legend>
              <span className="shrink-0 text-xs font-medium text-gray-500">
                {rotuloRegraEscolha(grupo, opcoesAtivas.length)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {opcoesAtivas.map((op) => {
                const marcado = idsEscolhidos.includes(op.id);
                const desabilitado = !escolhaUnica && !marcado && limiteAtingido;
                return (
                  <label
                    key={op.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      marcado ? 'border-primary bg-primary-light' : 'border-gray-200'
                    } ${desabilitado ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary'}`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type={escolhaUnica ? 'radio' : 'checkbox'}
                        name={escolhaUnica ? `grupo-${grupo.id}` : undefined}
                        checked={marcado}
                        disabled={desabilitado}
                        onChange={() =>
                          escolhaUnica
                            ? alternarOpcaoUnica(
                                grupo.id,
                                op.id,
                                grupo.obrigatorio || grupo.minEscolhas > 0,
                              )
                            : alternarOpcaoMultipla(grupo.id, op.id, grupo.maxEscolhas)
                        }
                        className="h-4 w-4 accent-primary"
                      />
                      {op.nome}
                    </span>
                    {op.precoAdicional > 0 && (
                      <span className="shrink-0 text-xs font-medium text-gray-500">
                        + {moeda(op.precoAdicional)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {!escolhaUnica && limiteAtingido && (
              <p className="mt-1 text-xs text-gray-400">
                Limite de {grupo.maxEscolhas} opções atingido.
              </p>
            )}
            {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
          </fieldset>
        );
      })}

      <div className="mt-4">
        <label
          htmlFor="observacao-produto"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Alguma observação?
        </label>
        <Textarea
          id="observacao-produto"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex.: sem cebola, molho separado, pouco sal..."
          rows={2}
          maxLength={280}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Quantidade
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            aria-label="Diminuir quantidade"
            className="h-8 w-8 rounded-full bg-gray-100 text-lg font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            -
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={quantidade}
            onChange={(e) => {
              const valor = Math.floor(Number(e.target.value));
              setQuantidade(Number.isFinite(valor) && valor >= 1 ? valor : 1);
            }}
            onFocus={(e) => e.target.select()}
            aria-label="Quantidade"
            className="w-16 rounded-lg border border-gray-300 px-1 py-1.5 text-center font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setQuantidade((q) => q + 1)}
            aria-label="Aumentar quantidade"
            className="h-8 w-8 rounded-full bg-gray-100 text-lg font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>

      <Button
        type="button"
        variante="primary"
        tamanho="md"
        onClick={aoConfirmar}
        aria-label={
          modoEdicao
            ? `Salvar alterações de ${produto.nome} — total ${moeda(total)}`
            : `Adicionar ${produto.nome} ao pedido — total ${moeda(total)}`
        }
        className="mt-5 w-full justify-center text-base"
      >
        <span aria-hidden="true">{modoEdicao ? '✓' : '+'}</span>{' '}
        {modoEdicao ? `Salvar alterações — ${moeda(total)}` : moeda(total)}
      </Button>
    </Modal>
  );
}
