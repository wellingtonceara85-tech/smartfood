import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ORDEM_STATUS, rotuloStatus } from '../lib/statusPedido';
import { PedidoAdmin, StatusPedido } from '../types';

function detalhePagamento(pedido: PedidoAdmin): string {
  if (pedido.formaPagamento === 'dinheiro') {
    return pedido.precisaTroco
      ? `Dinheiro (troco para R$ ${(pedido.trocoPara ?? 0).toFixed(2)})`
      : 'Dinheiro (sem troco)';
  }
  if (pedido.formaPagamento === 'cartao') {
    return `Cartão - ${pedido.tipoCartao === 'credito' ? 'Crédito' : 'Débito'}`;
  }
  if (pedido.formaPagamento === 'pix') return 'Pix';
  return pedido.formaPagamento;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function PainelPedidos() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const resp = await api<PedidoAdmin[]>('/api/admin/pedidos', { autenticado: true });
      setPedidos(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function mudarStatus(pedido: PedidoAdmin, status: StatusPedido) {
    const atualizado = await api<PedidoAdmin>(`/api/admin/pedidos/${pedido.id}/status`, {
      method: 'PATCH',
      autenticado: true,
      body: { status },
    });
    setPedidos((atuais) => atuais.map((p) => (p.id === atualizado.id ? atualizado : p)));
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800">Pedidos</h2>

      {pedidos.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum pedido recebido ainda.</p>
      )}

      {/* Desktop: tabela */}
      {pedidos.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Pedido</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Itens</th>
                <th className="px-3 py-2 font-medium">Entrega</th>
                <th className="px-3 py-2 font-medium">Pagamento</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-800">#{pedido.numero}</p>
                    <p className="text-xs text-gray-500">{formatarData(pedido.criadoEm)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-gray-800">{pedido.clienteNome}</p>
                    <p className="text-xs text-gray-500">{pedido.clienteTelefone}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <ul>
                      {pedido.itens.map((item, i) => (
                        <li key={i}>
                          {item.quantidade}x {item.nome}
                          {item.opcao ? ` (${item.opcao})` : ''}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {pedido.formaRecebimento === 'entrega'
                      ? `Entrega - ${pedido.bairroEntregaNome} (R$ ${pedido.valorEntrega.toFixed(2)})`
                      : 'Retirada no local'}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{detalhePagamento(pedido)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-800">
                    R$ {pedido.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={pedido.status}
                      onChange={(e) => mudarStatus(pedido, e.target.value as StatusPedido)}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    >
                      {ORDEM_STATUS.map((status) => (
                        <option key={status} value={status}>
                          {rotuloStatus(status, pedido.formaRecebimento)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile: cards empilhados */}
      <div className="flex flex-col gap-3 md:hidden">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="rounded-lg border bg-white p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  #{pedido.numero} · {pedido.clienteNome}
                </p>
                <p className="text-sm text-gray-500">
                  {pedido.clienteTelefone} · {formatarData(pedido.criadoEm)}
                </p>
              </div>
              <p className="font-semibold text-gray-800">R$ {pedido.total.toFixed(2)}</p>
            </div>

            <ul className="mt-2 text-sm text-gray-600">
              {pedido.itens.map((item, i) => (
                <li key={i}>
                  {item.quantidade}x {item.nome}
                  {item.opcao ? ` (${item.opcao})` : ''}
                </li>
              ))}
            </ul>

            <p className="mt-2 text-sm text-gray-600">
              {pedido.formaRecebimento === 'entrega'
                ? `Entrega - ${pedido.bairroEntregaNome} (R$ ${pedido.valorEntrega.toFixed(2)})`
                : 'Retirada no local'}
              {' · '}
              {detalhePagamento(pedido)}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={pedido.status}
                onChange={(e) => mudarStatus(pedido, e.target.value as StatusPedido)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              >
                {ORDEM_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {rotuloStatus(status, pedido.formaRecebimento)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
