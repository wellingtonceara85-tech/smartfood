import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ORDEM_STATUS, rotuloStatus } from '../lib/statusPedido';
import { PedidoAcompanhamento } from '../types';

export function AcompanharPedido() {
  const { slug, pedidoId } = useParams<{ slug: string; pedidoId: string }>();
  const [pedido, setPedido] = useState<PedidoAcompanhamento | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!slug || !pedidoId) return;

    function carregar() {
      api<PedidoAcompanhamento>(`/api/public/lojas/${slug}/pedidos/${pedidoId}`)
        .then(setPedido)
        .catch(() => setErro(true));
    }

    carregar();
    const intervalo = setInterval(carregar, 15000);
    return () => clearInterval(intervalo);
  }, [slug, pedidoId]);

  if (erro) {
    return <p className="p-6 text-center text-gray-600">Pedido não encontrado.</p>;
  }

  if (!pedido) {
    return <p className="p-6 text-center text-gray-500">Carregando...</p>;
  }

  const passoAtual = ORDEM_STATUS.indexOf(pedido.status);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-gray-500">{pedido.loja.nome}</p>
        <h1 className="text-xl font-bold text-gray-800">Pedido #{pedido.numero}</h1>

        <div className="my-6 flex items-center justify-between">
          {ORDEM_STATUS.map((status, i) => (
            <div key={status} className="flex flex-1 flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full ${i <= passoAtual ? 'bg-green-600' : 'bg-gray-200'}`}
              />
              {i < ORDEM_STATUS.length - 1 && (
                <div
                  className={`mt-1.5 h-0.5 w-full ${i < passoAtual ? 'bg-green-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-lg font-semibold text-green-700">
          {rotuloStatus(pedido.status, pedido.formaRecebimento)}
        </p>

        <ul className="mt-6 flex flex-col gap-1 border-t pt-4 text-sm text-gray-600">
          {pedido.itens.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {item.quantidade}x {item.nome}
                {item.opcao ? ` (${item.opcao})` : ''}
              </span>
              <span>R$ {item.subtotal.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-gray-600">
          {pedido.formaRecebimento === 'entrega'
            ? `Entrega - ${pedido.bairroEntregaNome ?? ''}`
            : 'Retirada no local'}
        </p>

        <p className="mt-2 text-right font-semibold text-gray-800">
          Total: R$ {pedido.total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
