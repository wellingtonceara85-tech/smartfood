import { DragEvent, useRef, useState } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { PedidoCard } from './PedidoCard';
import { rotuloColuna, transicaoValida } from '../../lib/statusPedido';
import { PedidoAdmin, StatusPedido } from '../../types';

/** Colunas visíveis na Central — "finalizado" continua sendo arquivamento manual (aba Finalizados), não uma coluna do quadro. */
const COLUNAS: StatusPedido[] = ['recebido', 'confirmado', 'em_preparo', 'pronto', 'entregue'];

const FILTROS_MOBILE: { chave: string; rotulo: string; status: StatusPedido[] }[] = [
  { chave: 'recebidos', rotulo: 'Recebidos', status: ['recebido', 'confirmado'] },
  { chave: 'preparo', rotulo: 'Preparo', status: ['em_preparo'] },
  { chave: 'entrega', rotulo: 'Pronto/Entrega', status: ['pronto', 'entregue'] },
  { chave: 'cancelados', rotulo: 'Cancelados', status: ['cancelado'] },
];

interface Props {
  pedidos: PedidoAdmin[];
  novosIds: Set<string>;
  aoMudarStatus: (pedido: PedidoAdmin, status: StatusPedido) => Promise<void> | void;
  aoAbrirCancelamento: (pedido: PedidoAdmin) => void;
}

export function CentralOperacional({
  pedidos,
  novosIds,
  aoMudarStatus,
  aoAbrirCancelamento,
}: Props) {
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaHover, setColunaHover] = useState<StatusPedido | null>(null);
  const [filtroMobile, setFiltroMobile] = useState<string>('recebidos');

  // Fonte de verdade do pedido sendo arrastado pras decisões de drop (ref,
  // não state): dragover/drop disparam em sequência síncrona rápida assim
  // que o mouse entra na coluna, ANTES do React ter tempo de re-renderizar
  // com o setState do dragstart — depender de state aqui é exatamente o bug
  // que fazia o preventDefault() nunca rodar num arrasto real (reproduzido e
  // confirmado: sem delay, dragover.defaultPrevented ficava sempre false).
  // Ref é síncrono, sem essa corrida.
  const arrastandoRef = useRef<{ id: string; status: StatusPedido } | null>(null);
  const contadoresHoverRef = useRef<Partial<Record<StatusPedido, number>>>({});

  function aoIniciarArrasto(pedidoId: string) {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    arrastandoRef.current = pedido ? { id: pedido.id, status: pedido.status } : null;
    setArrastandoId(pedidoId);
  }

  function aoFinalizarArrasto() {
    arrastandoRef.current = null;
    contadoresHoverRef.current = {};
    setArrastandoId(null);
    setColunaHover(null);
  }

  function aoEntrarNaColuna(e: DragEvent<HTMLDivElement>, statusColuna: StatusPedido) {
    const contador = (contadoresHoverRef.current[statusColuna] ?? 0) + 1;
    contadoresHoverRef.current[statusColuna] = contador;
    const arrasto = arrastandoRef.current;
    if (arrasto && transicaoValida(arrasto.status, statusColuna)) {
      e.preventDefault();
      setColunaHover(statusColuna);
    }
  }

  function aoSairDaColuna(statusColuna: StatusPedido) {
    const contador = Math.max(0, (contadoresHoverRef.current[statusColuna] ?? 1) - 1);
    contadoresHoverRef.current[statusColuna] = contador;
    if (contador === 0) {
      setColunaHover((atual) => (atual === statusColuna ? null : atual));
    }
  }

  function aoPassarSobreColuna(e: DragEvent<HTMLDivElement>, statusColuna: StatusPedido) {
    const arrasto = arrastandoRef.current;
    if (!arrasto || !transicaoValida(arrasto.status, statusColuna)) return;
    // dragover precisa ser sempre bloqueado (preventDefault) enquanto o
    // mouse estiver sobre um alvo válido — é essa chamada, repetida a cada
    // pixel de movimento, que autoriza o `drop` a disparar no fim.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function aoSoltarNaColuna(e: DragEvent<HTMLDivElement>, statusColuna: StatusPedido) {
    e.preventDefault();
    contadoresHoverRef.current[statusColuna] = 0;
    const arrasto = arrastandoRef.current;
    const pedidoId = arrasto?.id ?? e.dataTransfer.getData('text/plain');
    aoFinalizarArrasto();

    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;
    if (!transicaoValida(pedido.status, statusColuna)) return;

    if (statusColuna === 'cancelado') {
      // Soltar em Cancelado nunca cancela direto — só abre o modal de
      // motivo, igual ao link "Cancelar pedido". O card só sai de fato do
      // estágio atual depois da confirmação (ver ModalCancelarPedido).
      aoAbrirCancelamento(pedido);
      return;
    }
    aoMudarStatus(pedido, statusColuna);
  }

  if (pedidos.length === 0) {
    return (
      <EmptyState
        icone="🧾"
        titulo="Nenhum pedido em andamento"
        descricao="Assim que um cliente fizer um pedido pra agora, ele aparece aqui."
      />
    );
  }

  return (
    <div>
      {/* Desktop: Kanban com drag-and-drop nativo (HTML5), sem lib externa. */}
      <div className="hidden gap-3 overflow-x-auto pb-2 lg:flex">
        {COLUNAS.map((statusColuna) => {
          const pedidosColuna = pedidos.filter((p) => p.status === statusColuna);
          const emHover = colunaHover === statusColuna;
          return (
            <div
              key={statusColuna}
              onDragEnter={(e) => aoEntrarNaColuna(e, statusColuna)}
              onDragLeave={() => aoSairDaColuna(statusColuna)}
              onDragOver={(e) => aoPassarSobreColuna(e, statusColuna)}
              onDrop={(e) => aoSoltarNaColuna(e, statusColuna)}
              className={`flex w-72 shrink-0 flex-col gap-2 rounded-card border-2 border-dashed p-2 transition-colors ${
                emHover ? 'border-primary bg-primary-light/40' : 'border-transparent'
              }`}
            >
              <p className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {rotuloColuna(statusColuna)}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">
                  {pedidosColuna.length}
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {pedidosColuna.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    destacado={novosIds.has(pedido.id)}
                    aoMudarStatus={aoMudarStatus}
                    aoCancelar={aoAbrirCancelamento}
                    arrastavel
                    estaSendoArrastado={arrastandoId === pedido.id}
                    onArrastarInicio={aoIniciarArrasto}
                    onArrastarFim={aoFinalizarArrasto}
                  />
                ))}
                {pedidosColuna.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-200 px-2 py-4 text-center text-xs text-gray-400">
                    Sem pedidos
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Cancelado fica à parte — desvio lateral do fluxo, não uma etapa. */}
        {(() => {
          const cancelados = pedidos.filter((p) => p.status === 'cancelado');
          const emHover = colunaHover === 'cancelado';
          return (
            <div
              onDragEnter={(e) => aoEntrarNaColuna(e, 'cancelado')}
              onDragLeave={() => aoSairDaColuna('cancelado')}
              onDragOver={(e) => aoPassarSobreColuna(e, 'cancelado')}
              onDrop={(e) => aoSoltarNaColuna(e, 'cancelado')}
              className={`flex w-64 shrink-0 flex-col gap-2 rounded-card border-2 border-dashed p-2 opacity-90 transition-colors ${
                emHover ? 'border-red-400 bg-red-50' : 'border-transparent'
              }`}
            >
              <p className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                {rotuloColuna('cancelado')}
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-600">
                  {cancelados.length}
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {cancelados.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    destacado={false}
                    aoMudarStatus={aoMudarStatus}
                    compacto
                  />
                ))}
                {cancelados.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-200 px-2 py-4 text-center text-xs text-gray-400">
                    Nenhum cancelamento
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Mobile: sem drag — chips de filtro + cards com botão de próxima ação. */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTROS_MOBILE.map((filtro) => {
            const contagem = pedidos.filter((p) => filtro.status.includes(p.status)).length;
            return (
              <button
                key={filtro.chave}
                type="button"
                onClick={() => setFiltroMobile(filtro.chave)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filtroMobile === filtro.chave
                    ? 'bg-primary text-primary-text'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {filtro.rotulo}
                {contagem > 0 ? ` (${contagem})` : ''}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {(() => {
            const filtroAtivo = FILTROS_MOBILE.find((f) => f.chave === filtroMobile);
            const listaFiltrada = pedidos.filter((p) => filtroAtivo?.status.includes(p.status));
            if (listaFiltrada.length === 0) {
              return <EmptyState icone="🧾" titulo="Nenhum pedido nesse estágio agora" />;
            }
            return listaFiltrada.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                destacado={novosIds.has(pedido.id)}
                aoMudarStatus={aoMudarStatus}
                aoCancelar={aoAbrirCancelamento}
              />
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
