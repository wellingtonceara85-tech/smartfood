import { useState } from 'react';
import { BairroEntrega, FormaPagamento, ItemCarrinho } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  itens: ItemCarrinho[];
  total: number;
  nome: string;
  aoMudarNome: (valor: string) => void;
  telefone: string;
  aoMudarTelefone: (valor: string) => void;
  aoFinalizar: () => void;
  aoFechar: () => void;
  finalizando: boolean;
  removerItem: (chave: string) => void;
  bairros: BairroEntrega[];
  formaRecebimento: 'entrega' | 'retirada';
  aoMudarFormaRecebimento: (forma: 'entrega' | 'retirada') => void;
  bairroSelecionadoId: string | null;
  aoMudarBairro: (id: string | null) => void;
  taxaEntrega: number;
  chavePix: string | null;
  formaPagamento: FormaPagamento;
  aoMudarFormaPagamento: (forma: FormaPagamento) => void;
  precisaTroco: boolean;
  aoMudarPrecisaTroco: (valor: boolean) => void;
  trocoPara: string;
  aoMudarTrocoPara: (valor: string) => void;
  tipoCartao: 'debito' | 'credito' | null;
  aoMudarTipoCartao: (valor: 'debito' | 'credito') => void;
}

const OPCOES_PAGAMENTO_BASE: { valor: FormaPagamento; rotulo: string; icone: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro', icone: '💵' },
  { valor: 'cartao', rotulo: 'Cartão', icone: '💳' },
];

const SEGMENTO_ATIVO = 'bg-primary text-primary-text';
const SEGMENTO_INATIVO = 'bg-white text-gray-600 hover:bg-gray-50';
const RUBRICA = 'mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500';

export function ResumoPedido({
  itens,
  total,
  nome,
  aoMudarNome,
  telefone,
  aoMudarTelefone,
  aoFinalizar,
  aoFechar,
  finalizando,
  removerItem,
  bairros,
  formaRecebimento,
  aoMudarFormaRecebimento,
  bairroSelecionadoId,
  aoMudarBairro,
  taxaEntrega,
  chavePix,
  formaPagamento,
  aoMudarFormaPagamento,
  precisaTroco,
  aoMudarPrecisaTroco,
  trocoPara,
  aoMudarTrocoPara,
  tipoCartao,
  aoMudarTipoCartao,
}: Props) {
  const [chavePixCopiada, setChavePixCopiada] = useState(false);

  async function copiarChavePix() {
    if (!chavePix) return;
    try {
      await navigator.clipboard.writeText(chavePix);
      setChavePixCopiada(true);
      setTimeout(() => setChavePixCopiada(false), 2000);
    } catch {
      // clipboard indisponível (ex: contexto não seguro) — sem feedback, cliente copia manualmente
    }
  }

  const entregaSemBairroEscolhido = formaRecebimento === 'entrega' && !bairroSelecionadoId;
  const trocoInvalido =
    formaPagamento === 'dinheiro' &&
    precisaTroco &&
    (!trocoPara.trim() || Number(trocoPara.replace(',', '.')) <= total);
  const cartaoSemTipo = formaPagamento === 'cartao' && !tipoCartao;

  const opcoesPagamento = [
    ...OPCOES_PAGAMENTO_BASE,
    ...(chavePix ? [{ valor: 'pix' as const, rotulo: 'Pix', icone: '📱' }] : []),
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Fechar resumo do pedido"
        onClick={aoFechar}
        className="fixed inset-0 z-40 bg-black/40"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-base font-semibold text-gray-800">
              <span aria-hidden="true">🛒</span> Seu pedido
            </span>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="rounded-full p-1 text-xl leading-none text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {itens.length > 0 && (
            <ul className="mb-3 max-h-32 overflow-y-auto text-sm">
              {itens.map((item) => (
                <li
                  key={`${item.produtoId}-${item.opcao ?? ''}`}
                  className="flex justify-between py-1"
                >
                  <span>
                    {item.quantidade}x {item.nome}
                    {item.opcao ? ` (${item.opcao})` : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    R$ {(item.preco * item.quantidade).toFixed(2)}
                    <button
                      type="button"
                      onClick={() => removerItem(`${item.produtoId}-${item.opcao ?? ''}`)}
                      className="text-red-600 transition-colors hover:text-red-700"
                      aria-label="Remover item"
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
              {formaRecebimento === 'entrega' && taxaEntrega > 0 && (
                <li className="flex justify-between py-1 text-gray-500">
                  <span>Taxa de entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </li>
              )}
            </ul>
          )}

          {bairros.length > 0 && (
            <div className="mb-3">
              <p className={RUBRICA}>Entrega</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-lg border border-gray-300">
                  <button
                    type="button"
                    onClick={() => aoMudarFormaRecebimento('retirada')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      formaRecebimento === 'retirada' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                    }`}
                  >
                    <span aria-hidden="true">🏠</span> Retirada
                  </button>
                  <button
                    type="button"
                    onClick={() => aoMudarFormaRecebimento('entrega')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      formaRecebimento === 'entrega' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                    }`}
                  >
                    <span aria-hidden="true">🛵</span> Entrega
                  </button>
                </div>

                {formaRecebimento === 'entrega' && (
                  <select
                    value={bairroSelecionadoId ?? ''}
                    onChange={(e) => aoMudarBairro(e.target.value || null)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecione o bairro</option>
                    {bairros.map((bairro) => (
                      <option key={bairro.id} value={bairro.id}>
                        {bairro.nomeBairro} — R$ {bairro.valorEntrega.toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="mb-3">
            <p className={RUBRICA}>Pagamento</p>
            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              {opcoesPagamento.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => aoMudarFormaPagamento(opcao.valor)}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                    formaPagamento === opcao.valor ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                  }`}
                >
                  <span aria-hidden="true">{opcao.icone}</span> {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          {formaPagamento === 'dinheiro' && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Precisa de troco?</span>
              <div className="flex overflow-hidden rounded-lg border border-gray-300">
                <button
                  type="button"
                  onClick={() => aoMudarPrecisaTroco(false)}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    !precisaTroco ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => aoMudarPrecisaTroco(true)}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    precisaTroco ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                  }`}
                >
                  Sim
                </button>
              </div>
              {precisaTroco && (
                <input
                  value={trocoPara}
                  onChange={(e) => aoMudarTrocoPara(e.target.value)}
                  placeholder="Troco para quanto? Ex: 50"
                  inputMode="decimal"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          )}

          {formaPagamento === 'cartao' && (
            <div className="mb-3 flex overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => aoMudarTipoCartao('debito')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  tipoCartao === 'debito' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                }`}
              >
                Débito
              </button>
              <button
                type="button"
                onClick={() => aoMudarTipoCartao('credito')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  tipoCartao === 'credito' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                }`}
              >
                Crédito
              </button>
            </div>
          )}

          {formaPagamento === 'pix' && chavePix && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              <span>
                Chave Pix da loja: <span className="font-medium text-gray-800">{chavePix}</span>
              </span>
              <button
                type="button"
                onClick={copiarChavePix}
                className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-primary-hover shadow-sm transition-colors hover:bg-primary-light"
              >
                {chavePixCopiada ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}

          <div className="mb-3 flex flex-col gap-2">
            <Input
              value={nome}
              onChange={(e) => aoMudarNome(e.target.value)}
              placeholder="Seu nome"
            />
            <Input
              value={telefone}
              onChange={(e) => aoMudarTelefone(e.target.value)}
              placeholder="Seu telefone com DDD"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Total: R$ {total.toFixed(2)}</span>
            <Button
              type="button"
              tamanho="md"
              className="rounded-full px-5 shadow-sm"
              disabled={
                itens.length === 0 ||
                !nome.trim() ||
                !telefone ||
                finalizando ||
                entregaSemBairroEscolhido ||
                trocoInvalido ||
                cartaoSemTipo
              }
              onClick={aoFinalizar}
            >
              {finalizando ? 'Enviando...' : 'Finalizar no WhatsApp'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
