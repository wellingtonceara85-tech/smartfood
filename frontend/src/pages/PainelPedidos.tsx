import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Loading } from '../components/ui/Loading';
import { api } from '../lib/api';
import {
  EnderecoEntrega,
  formatarEnderecoCompleto,
  formatarEnderecoResumo,
  formatarValorEntrega,
  maskCep,
} from '../lib/endereco';
import { ORDEM_STATUS, rotuloStatus } from '../lib/statusPedido';
import { PedidoAdmin, StatusPedido } from '../types';

function enderecoDoPedido(pedido: PedidoAdmin): EnderecoEntrega | null {
  if (
    !pedido.entregaCep ||
    !pedido.entregaLogradouro ||
    !pedido.entregaNumero ||
    !pedido.entregaBairro ||
    !pedido.entregaCidade ||
    !pedido.entregaEstado
  ) {
    return null;
  }
  return {
    cep: pedido.entregaCep,
    logradouro: pedido.entregaLogradouro,
    numero: pedido.entregaNumero,
    complemento: pedido.entregaComplemento,
    bairro: pedido.entregaBairro,
    cidade: pedido.entregaCidade,
    estado: pedido.entregaEstado,
    referencia: pedido.entregaReferencia,
  };
}

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

const CORES_STATUS: Record<StatusPedido, { ativo: string; inativo: string }> = {
  recebido: { ativo: 'bg-gray-600 text-white', inativo: 'bg-gray-100 text-gray-600' },
  em_preparo: { ativo: 'bg-yellow-500 text-white', inativo: 'bg-yellow-50 text-yellow-700' },
  pronto: { ativo: 'bg-secondary text-white', inativo: 'bg-secondary-light text-secondary-hover' },
  entregue: { ativo: 'bg-primary text-white', inativo: 'bg-primary-light text-primary-hover' },
  finalizado: { ativo: 'bg-gray-700 text-white', inativo: 'bg-gray-100 text-gray-500' },
};

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
        const cores = CORES_STATUS[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => aoMudar(status)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              ativo ? cores.ativo : `${cores.inativo} hover:opacity-80`
            }`}
          >
            {rotuloStatus(status, pedido.formaRecebimento)}
          </button>
        );
      })}
    </div>
  );
}

function EnderecoPedido({ pedido }: { pedido: PedidoAdmin }) {
  const [expandido, setExpandido] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const endereco = enderecoDoPedido(pedido);

  if (!endereco) {
    return <p className="text-xs text-gray-400">Endereço não informado</p>;
  }

  async function copiarEndereco() {
    if (!endereco) return;
    try {
      await navigator.clipboard.writeText(formatarEnderecoCompleto(endereco).join('\n'));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — sem feedback, lojista copia manualmente
    }
  }

  return (
    <div className="text-xs text-gray-600">
      <p>{formatarEnderecoResumo(endereco)}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="font-medium text-primary-hover hover:underline"
        >
          {expandido ? 'Ocultar endereço' : 'Ver endereço completo'}
        </button>
        <button
          type="button"
          onClick={copiarEndereco}
          className="font-medium text-primary-hover hover:underline"
        >
          {copiado ? 'Copiado!' : 'Copiar endereço'}
        </button>
      </div>
      {expandido && (
        <ul className="mt-1 list-inside list-disc text-gray-500">
          <li>CEP: {maskCep(endereco.cep)}</li>
          <li>
            {endereco.logradouro}, {endereco.numero}
            {endereco.complemento ? ` - ${endereco.complemento}` : ''}
          </li>
          <li>{endereco.bairro}</li>
          <li>
            {endereco.cidade}/{endereco.estado}
          </li>
          {endereco.referencia && <li>Referência: {endereco.referencia}</li>}
        </ul>
      )}
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

  if (carregando) return <Loading />;

  const pedidosAtivos = pedidos.filter((p) => p.status !== 'finalizado');
  const pedidosFinalizados = pedidos.filter((p) => p.status === 'finalizado');
  const pedidosExibidos = aba === 'ativos' ? pedidosAtivos : pedidosFinalizados;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-800">Pedidos</h2>

      <div className="flex gap-4 border-b">
        <button
          type="button"
          onClick={() => setAba('ativos')}
          className={`px-1 pb-2 text-sm font-medium transition-colors ${
            aba === 'ativos'
              ? 'border-b-2 border-primary text-primary-hover'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ativos{pedidosAtivos.length > 0 ? ` (${pedidosAtivos.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setAba('finalizados')}
          className={`px-1 pb-2 text-sm font-medium transition-colors ${
            aba === 'finalizados'
              ? 'border-b-2 border-primary text-primary-hover'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Finalizados{pedidosFinalizados.length > 0 ? ` (${pedidosFinalizados.length})` : ''}
        </button>
      </div>

      {pedidosExibidos.length === 0 && (
        <EmptyState
          icone="🧾"
          titulo={aba === 'ativos' ? 'Nenhum pedido ativo no momento' : 'Nenhum pedido finalizado'}
          descricao={
            aba === 'ativos'
              ? 'Assim que um cliente fizer um pedido, ele aparece aqui.'
              : 'Pedidos marcados como Finalizado aparecem nessa aba.'
          }
        />
      )}

      {/* Desktop: tabela */}
      {pedidosExibidos.length > 0 && (
        <div className="hidden overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Itens</th>
                <th className="px-4 py-3 font-semibold">Entrega</th>
                <th className="px-4 py-3 font-semibold">Pagamento</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidosExibidos.map((pedido) => (
                <tr key={pedido.id} className="align-top transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">#{pedido.numero}</p>
                    <p className="text-xs text-gray-500">{formatarData(pedido.criadoEm)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{pedido.clienteNome}</p>
                    <p className="text-xs text-gray-500">{pedido.clienteTelefone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <ul>
                      {pedido.itens.map((item, i) => (
                        <li key={i}>
                          {item.quantidade}x {item.nome}
                          {item.opcao ? ` (${item.opcao})` : ''}
                          {item.observacao && (
                            <span className="block text-xs italic text-gray-400">
                              Obs: {item.observacao}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {pedido.formaRecebimento === 'entrega' ? (
                      <div>
                        <p>
                          Entrega - {pedido.bairroEntregaNome} (
                          {formatarValorEntrega(pedido.valorEntrega)})
                        </p>
                        <div className="mt-1">
                          <EnderecoPedido pedido={pedido} />
                        </div>
                      </div>
                    ) : (
                      'Retirada no local'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{detalhePagamento(pedido)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">
                    R$ {pedido.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
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
      <div className="flex flex-col gap-3 lg:hidden">
        {pedidosExibidos.map((pedido) => (
          <Card key={pedido.id}>
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
                  {item.observacao && (
                    <span className="block text-xs italic text-gray-400">
                      Obs: {item.observacao}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-2 text-sm text-gray-600">
              {pedido.formaRecebimento === 'entrega'
                ? `Entrega - ${pedido.bairroEntregaNome} (${formatarValorEntrega(pedido.valorEntrega)})`
                : 'Retirada no local'}
              {' · '}
              {detalhePagamento(pedido)}
            </p>

            {pedido.formaRecebimento === 'entrega' && (
              <div className="mt-2">
                <EnderecoPedido pedido={pedido} />
              </div>
            )}

            <div className="mt-3">
              <SeletorStatus pedido={pedido} aoMudar={(status) => mudarStatus(pedido, status)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
