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

function SeletorStatus({
  pedido,
  aoMudar,
}: {
  pedido: PedidoAdmin;
  aoMudar: (status: StatusPedido) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {ORDEM_STATUS.map((status) => {
        const ativo = pedido.status === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => aoMudar(status)}
            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              ativo ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rotuloStatus(status, pedido.formaRecebimento)}
          </button>
        );
      })}
    </div>
  );
}

export function PainelPedidos() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<'ativos' | 'finalizados'>('ativos');

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

  const pedidosAtivos = pedidos.filter((p) => p.status !== 'finalizado');
  const pedidosFinalizados = pedidos.filter((p) => p.status === 'finalizado');
  const pedidosExibidos = aba === 'ativos' ? pedidosAtivos : pedidosFinalizados;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800">Pedidos</h2>

      <div className="flex gap-4 border-b">
        <button
          type="button"
          onClick={() => setAba('ativos')}
          className={`px-1 pb-2 text-sm font-medium ${
            aba === 'ativos'
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ativos{pedidosAtivos.length > 0 ? ` (${pedidosAtivos.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setAba('finalizados')}
          className={`px-1 pb-2 text-sm font-medium ${
            aba === 'finalizados'
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Finalizados{pedidosFinalizados.length > 0 ? ` (${pedidosFinalizados.length})` : ''}
        </button>
      </div>

      {pedidosExibidos.length === 0 && (
        <p className="text-sm text-gray-500">
          {aba === 'ativos' ? 'Nenhum pedido ativo no momento.' : 'Nenhum pedido finalizado ainda.'}
        </p>
      )}

      {/* Desktop: tabela */}
      {pedidosExibidos.length > 0 && (
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
              {pedidosExibidos.map((pedido) => (
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
                    <SeletorStatus
                      pedido={pedido}
                      aoMudar={(status) => mudarStatus(pedido, status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile: cards empilhados */}
      <div className="flex flex-col gap-3 md:hidden">
        {pedidosExibidos.map((pedido) => (
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

            <div className="mt-3">
              <SeletorStatus pedido={pedido} aoMudar={(status) => mudarStatus(pedido, status)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
