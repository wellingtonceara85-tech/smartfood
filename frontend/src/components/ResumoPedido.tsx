import { BairroEntrega, FormaPagamento, ItemCarrinho } from '../types';

interface Props {
  itens: ItemCarrinho[];
  total: number;
  nome: string;
  aoMudarNome: (valor: string) => void;
  telefone: string;
  aoMudarTelefone: (valor: string) => void;
  aoFinalizar: () => void;
  finalizando: boolean;
  removerItem: (chave: string) => void;
  bairros: BairroEntrega[];
  formaRecebimento: 'entrega' | 'retirada';
  aoMudarFormaRecebimento: (forma: 'entrega' | 'retirada') => void;
  bairroSelecionadoId: string | null;
  aoMudarBairro: (id: string | null) => void;
  taxaEntrega: number;
  formaPagamento: FormaPagamento;
  aoMudarFormaPagamento: (forma: FormaPagamento) => void;
}

const OPCOES_PAGAMENTO: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'pix', rotulo: 'Pix' },
];

export function ResumoPedido({
  itens,
  total,
  nome,
  aoMudarNome,
  telefone,
  aoMudarTelefone,
  aoFinalizar,
  finalizando,
  removerItem,
  bairros,
  formaRecebimento,
  aoMudarFormaRecebimento,
  bairroSelecionadoId,
  aoMudarBairro,
  taxaEntrega,
  formaPagamento,
  aoMudarFormaPagamento,
}: Props) {
  const entregaSemBairroEscolhido = formaRecebimento === 'entrega' && !bairroSelecionadoId;

  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-2xl">
        {itens.length > 0 && (
          <ul className="mb-2 max-h-32 overflow-y-auto text-sm">
            {itens.map((item) => (
              <li
                key={`${item.produtoId}-${item.opcao ?? ''}`}
                className="flex justify-between py-0.5"
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
                    className="text-red-600"
                    aria-label="Remover item"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
            {formaRecebimento === 'entrega' && taxaEntrega > 0 && (
              <li className="flex justify-between py-0.5 text-gray-500">
                <span>Taxa de entrega</span>
                <span>R$ {taxaEntrega.toFixed(2)}</span>
              </li>
            )}
          </ul>
        )}

        {bairros.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => aoMudarFormaRecebimento('retirada')}
                className={`px-3 py-1.5 text-sm font-medium ${
                  formaRecebimento === 'retirada'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                Retirada
              </button>
              <button
                type="button"
                onClick={() => aoMudarFormaRecebimento('entrega')}
                className={`px-3 py-1.5 text-sm font-medium ${
                  formaRecebimento === 'entrega'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                Entrega
              </button>
            </div>

            {formaRecebimento === 'entrega' && (
              <select
                value={bairroSelecionadoId ?? ''}
                onChange={(e) => aoMudarBairro(e.target.value || null)}
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
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
        )}

        <div className="mb-2 flex overflow-hidden rounded-lg border border-gray-300">
          {OPCOES_PAGAMENTO.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => aoMudarFormaPagamento(opcao.valor)}
              className={`flex-1 px-3 py-1.5 text-sm font-medium ${
                formaPagamento === opcao.valor
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>

        <input
          value={nome}
          onChange={(e) => aoMudarNome(e.target.value)}
          placeholder="Seu nome"
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={telefone}
          onChange={(e) => aoMudarTelefone(e.target.value)}
          placeholder="Seu telefone com DDD"
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800">Total: R$ {total.toFixed(2)}</span>
          <button
            type="button"
            disabled={
              itens.length === 0 ||
              !nome.trim() ||
              !telefone ||
              finalizando ||
              entregaSemBairroEscolhido
            }
            onClick={aoFinalizar}
            className="rounded-full bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {finalizando ? 'Enviando...' : 'Finalizar no WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
