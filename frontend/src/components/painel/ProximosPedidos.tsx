import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { formatarAgendamentoCurto, ordenarProximosPedidos } from '../../lib/agendaProxima';
import { rotuloStatus } from '../../lib/statusPedido';
import { PedidoAdmin } from '../../types';

const LIMITE_EXIBIDO = 5;

const BADGE_COR_STATUS: Record<
  PedidoAdmin['status'],
  'primary' | 'secondary' | 'gray' | 'red' | 'yellow'
> = {
  recebido: 'red',
  em_preparo: 'yellow',
  pronto: 'secondary',
  entregue: 'primary',
  finalizado: 'gray',
};

function ItemProximoPedido({ pedido, destacado }: { pedido: PedidoAdmin; destacado: boolean }) {
  return (
    <Link
      to="/painel/pedidos"
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-gray-50 ${
        destacado ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold text-gray-800">#{pedido.numero}</span>
          <Badge cor={BADGE_COR_STATUS[pedido.status]}>
            {rotuloStatus(pedido.status, pedido.formaRecebimento)}
          </Badge>
          {pedido.tipoPedido === 'agendado' && pedido.dataAgendamento && (
            <Badge cor="secondary">📅 {formatarAgendamentoCurto(pedido.dataAgendamento)}</Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {pedido.formaRecebimento === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}
          {pedido.tipoPedido === 'imediato' ? ' · Para agora' : ''}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-gray-800">
        R$ {pedido.total.toFixed(2)}
      </span>
    </Link>
  );
}

export function ProximosPedidos({
  pedidos,
  novosIds,
}: {
  pedidos: PedidoAdmin[];
  novosIds: Set<string>;
}) {
  const proximos = ordenarProximosPedidos(pedidos).slice(0, LIMITE_EXIBIDO);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Próximos pedidos</p>
        {pedidos.length > 0 && (
          <Link
            to="/painel/pedidos"
            className="text-xs font-semibold text-primary-hover hover:underline"
          >
            Ver todos →
          </Link>
        )}
      </div>

      {proximos.length === 0 ? (
        <EmptyState
          icone="🎉"
          titulo="Tudo tranquilo por aqui."
          descricao="Nenhum pedido aguardando sua atenção."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {proximos.map((pedido) => (
            <ItemProximoPedido
              key={pedido.id}
              pedido={pedido}
              destacado={novosIds.has(pedido.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
