import { ItemCarrinho } from '../types';

interface Props {
  itens: ItemCarrinho[];
  total: number;
  telefone: string;
  aoMudarTelefone: (valor: string) => void;
  aoFinalizar: () => void;
  finalizando: boolean;
  removerItem: (chave: string) => void;
}

export function ResumoPedido({
  itens,
  total,
  telefone,
  aoMudarTelefone,
  aoFinalizar,
  finalizando,
  removerItem,
}: Props) {
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
          </ul>
        )}

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
            disabled={itens.length === 0 || !telefone || finalizando}
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
