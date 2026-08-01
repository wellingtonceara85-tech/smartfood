import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { api } from '../lib/api';
import { ORDEM_STATUS_CLIENTE, rotuloStatus } from '../lib/statusPedido';
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Pro cliente, "finalizado" (arquivamento interno do lojista) aparece como entregue/retirado.
  const statusExibido = pedido.status === 'finalizado' ? 'entregue' : pedido.status;
  const passoAtual = ORDEM_STATUS_CLIENTE.indexOf(statusExibido);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <Card className="mx-auto max-w-md shadow-card-hover">
        {slug && (
          <Link
            to={`/${slug}`}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-hover hover:underline"
          >
            ← Voltar ao cardápio
          </Link>
        )}
        <p className="text-sm text-gray-500">{pedido.loja.nome}</p>
        <h1 className="text-xl font-bold text-gray-800">Pedido #{pedido.numero}</h1>

        <div className="my-6 flex items-center justify-between">
          {ORDEM_STATUS_CLIENTE.map((status, i) => (
            <div key={status} className="flex flex-1 flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full transition-colors ${i <= passoAtual ? 'bg-primary' : 'bg-gray-200'}`}
              />
              {i < ORDEM_STATUS_CLIENTE.length - 1 && (
                <div
                  className={`mt-1.5 h-0.5 w-full transition-colors ${i < passoAtual ? 'bg-primary' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-lg font-semibold text-primary-hover">
          {rotuloStatus(statusExibido, pedido.formaRecebimento)}
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
      </Card>
    </div>
  );
}
