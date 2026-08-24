import { DragEvent, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  EnderecoEntrega,
  formatarEnderecoCompleto,
  formatarEnderecoResumo,
  formatarValorEntrega,
  maskCep,
} from '../../lib/endereco';
import { formatarAgendamentoCurto } from '../../lib/agendaProxima';
import {
  ORDEM_STATUS,
  proximoStatus,
  rotuloProximaAcao,
  rotuloStatus,
  tituloCardPedido,
  transicaoValida,
} from '../../lib/statusPedido';
import { formatarTempoDecorrido } from '../../lib/tempo';
import { PedidoAdmin, StatusPedido } from '../../types';

export const BADGE_COR_STATUS: Record<
  StatusPedido,
  'primary' | 'secondary' | 'gray' | 'red' | 'yellow'
> = {
  recebido: 'red',
  confirmado: 'yellow',
  em_preparo: 'secondary',
  pronto: 'primary',
  entregue: 'primary',
  finalizado: 'gray',
  cancelado: 'red',
};

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

interface Props {
  pedido: PedidoAdmin;
  destacado: boolean;
  aoMudarStatus: (pedido: PedidoAdmin, status: StatusPedido) => void;
  aoCancelar?: (pedido: PedidoAdmin) => void;
  /** Só true nas colunas do desktop — mobile nunca arrasta (ver missão). */
  arrastavel?: boolean;
  compacto?: boolean;
  /** Card sendo arrastado agora — feedback visual (opacidade) enquanto a mão está no ar. */
  estaSendoArrastado?: boolean;
  onArrastarInicio?: (pedidoId: string) => void;
  onArrastarFim?: () => void;
}

export function PedidoCard({
  pedido,
  destacado,
  aoMudarStatus,
  aoCancelar,
  arrastavel = false,
  compacto = false,
  estaSendoArrastado = false,
  onArrastarInicio,
  onArrastarFim,
}: Props) {
  const proximo = proximoStatus(pedido.status);
  const rotuloAcao = rotuloProximaAcao(pedido.status, pedido.formaRecebimento);
  const podeCancelar = transicaoValida(pedido.status, 'cancelado');
  const statusManuaisValidos = ORDEM_STATUS.filter(
    (status) => status !== pedido.status && transicaoValida(pedido.status, status),
  );

  // Arrasto só inicia pela alça (⠿), nunca pelo card inteiro — o card tem
  // botões e links (Aceitar, Cancelar, Copiar endereço...) que precisam
  // continuar 100% clicáveis, sem competir com o gesto de arrastar.
  function aoIniciarArrasto(e: DragEvent<HTMLSpanElement>) {
    e.dataTransfer.setData('text/plain', pedido.id);
    e.dataTransfer.effectAllowed = 'move';
    onArrastarInicio?.(pedido.id);
  }

  return (
    <Card
      className={`flex flex-col gap-3 transition-opacity ${
        destacado ? 'ring-2 ring-primary shadow-card-hover' : ''
      } ${estaSendoArrastado ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          {arrastavel && (
            <span
              draggable
              onDragStart={aoIniciarArrasto}
              onDragEnd={onArrastarFim}
              aria-hidden="true"
              title="Arraste para mudar o status"
              className="-ml-1 mt-0.5 shrink-0 cursor-grab select-none rounded px-1 text-sm leading-none text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
            >
              ⠿
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-base font-bold text-gray-800">#{pedido.numero}</span>
              <Badge cor={BADGE_COR_STATUS[pedido.status]}>
                {tituloCardPedido(pedido.status, pedido.formaRecebimento)}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatarTempoDecorrido(pedido.criadoEm)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge cor="gray">
            {pedido.formaRecebimento === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}
          </Badge>
          {pedido.tipoPedido === 'agendado' && <Badge cor="secondary">📅 Agendado</Badge>}
        </div>
      </div>

      {pedido.tipoPedido === 'agendado' && pedido.dataAgendamento && (
        <p className="-mt-2 text-sm font-semibold text-secondary-hover">
          📅 Agendado — {formatarAgendamentoCurto(pedido.dataAgendamento)}
        </p>
      )}

      <div>
        <p className="font-medium text-gray-800">{pedido.clienteNome}</p>
        <p className="text-xs text-gray-500">{pedido.clienteTelefone}</p>
      </div>

      {!compacto && (
        <ul className="text-sm text-gray-600">
          {pedido.itens.map((item, i) => (
            <li key={i}>
              {item.quantidade}x {item.nome}
              {item.opcao ? ` (${item.opcao})` : ''}
              {item.observacao && (
                <span className="block text-xs italic text-gray-400">Obs: {item.observacao}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {compacto && (
        <p className="line-clamp-2 text-sm text-gray-600">
          {pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`).join(', ')}
        </p>
      )}

      {!compacto && (
        <div className="text-sm text-gray-600">
          {pedido.formaRecebimento === 'entrega' ? (
            <div>
              <p>
                Entrega - {pedido.bairroEntregaNome} ({formatarValorEntrega(pedido.valorEntrega)})
              </p>
              <div className="mt-1">
                <EnderecoPedido pedido={pedido} />
              </div>
            </div>
          ) : (
            'Retirada no local'
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{detalhePagamento(pedido)}</span>
        <span className="font-semibold text-gray-800">R$ {pedido.total.toFixed(2)}</span>
      </div>

      {pedido.status === 'cancelado' && pedido.motivoCancelamento && (
        <p className="rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-700">
          Motivo do cancelamento: {pedido.motivoCancelamento}
        </p>
      )}

      {rotuloAcao && proximo && (
        <Button
          type="button"
          tamanho="md"
          className="w-full justify-center"
          onClick={() => aoMudarStatus(pedido, proximo)}
        >
          {rotuloAcao}
        </Button>
      )}

      {podeCancelar && aoCancelar && (
        <button
          type="button"
          onClick={() => aoCancelar(pedido)}
          className="text-xs font-medium text-red-500 transition-colors hover:text-red-700 hover:underline"
        >
          Cancelar pedido
        </button>
      )}

      {statusManuaisValidos.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-medium text-gray-400 transition-colors hover:text-gray-600">
            Alterar status manualmente
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {statusManuaisValidos.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => aoMudarStatus(pedido, status)}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                {rotuloStatus(status, pedido.formaRecebimento)}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400">{formatarData(pedido.criadoEm)}</p>
        </details>
      )}
    </Card>
  );
}
