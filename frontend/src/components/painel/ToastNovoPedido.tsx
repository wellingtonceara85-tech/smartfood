import { useEffect, useState } from 'react';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { PedidoAdmin } from '../../types';

const DURACAO_VISIVEL_MS = 5_000;

export function ToastNovoPedido() {
  const { ultimoPedidoNovo } = useNotificacoes();
  const [pedidoVisivel, setPedidoVisivel] = useState<PedidoAdmin | null>(null);

  useEffect(() => {
    if (!ultimoPedidoNovo) return;
    setPedidoVisivel(ultimoPedidoNovo);
    const timeout = setTimeout(() => setPedidoVisivel(null), DURACAO_VISIVEL_MS);
    return () => clearTimeout(timeout);
  }, [ultimoPedidoNovo]);

  if (!pedidoVisivel) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 z-40 mx-auto max-w-sm rounded-card bg-gray-800 px-4 py-3 text-sm text-white shadow-card-hover"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
    >
      <span aria-hidden="true">🛒</span> Novo pedido recebido — #{pedidoVisivel.numero}
    </div>
  );
}
