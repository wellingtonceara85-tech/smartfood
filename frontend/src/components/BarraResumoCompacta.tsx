interface Props {
  quantidadeItens: number;
  total: number;
  aoAbrir: () => void;
}

export function BarraResumoCompacta({ quantidadeItens, total, aoAbrir }: Props) {
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-green-600 px-4 py-3 text-white shadow-[0_-2px_8px_rgba(0,0,0,0.15)]"
    >
      <span className="text-sm font-medium">
        {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'} · R$ {total.toFixed(2)}
      </span>
      <span className="text-sm font-semibold underline">Ver pedido</span>
    </button>
  );
}
