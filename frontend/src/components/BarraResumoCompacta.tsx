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
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between rounded-t-xl bg-primary px-4 py-3.5 text-white shadow-[0_-4px_12px_rgba(0,0,0,0.15)] transition-colors hover:bg-primary-hover"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden="true">🛒</span>
        {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'} · R$ {total.toFixed(2)}
      </span>
      <span className="text-sm font-semibold underline underline-offset-2">Ver pedido</span>
    </button>
  );
}
