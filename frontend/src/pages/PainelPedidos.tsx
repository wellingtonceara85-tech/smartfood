import { useEffect, useRef, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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
import {
  ORDEM_STATUS,
  proximoStatus,
  rotuloProximaAcao,
  rotuloStatus,
  tituloCardPedido,
} from '../lib/statusPedido';
import { formatarTempoDecorrido } from '../lib/tempo';
import { PedidoAdmin, StatusPedido } from '../types';

type Aba = 'agora' | 'agendados' | 'finalizados';

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

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** "HOJE" / "AMANHÃ" / "23 AGO" — agrupa a aba Agendados como uma pequena agenda operacional. */
function rotuloGrupoData(dataISO: string, hoje: Date = new Date()): string {
  const data = new Date(dataISO);
  const diffDias = Math.round(
    (inicioDoDia(data).getTime() - inicioDoDia(hoje).getTime()) / 86_400_000,
  );
  if (diffDias === 0) return 'HOJE';
  if (diffDias === 1) return 'AMANHÃ';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(data)
    .toUpperCase()
    .replace('.', '');
}

function agruparPorData(lista: PedidoAdmin[]): { rotulo: string; pedidos: PedidoAdmin[] }[] {
  const grupos: { rotulo: string; pedidos: PedidoAdmin[] }[] = [];
  for (const pedido of lista) {
    const rotulo = pedido.dataAgendamento ? rotuloGrupoData(pedido.dataAgendamento) : 'Sem data';
    const grupoExistente =
      grupos[grupos.length - 1]?.rotulo === rotulo ? grupos[grupos.length - 1] : null;
    if (grupoExistente) grupoExistente.pedidos.push(pedido);
    else grupos.push({ rotulo, pedidos: [pedido] });
  }
  return grupos;
}

const BADGE_COR_STATUS: Record<StatusPedido, 'primary' | 'secondary' | 'gray' | 'red' | 'yellow'> =
  {
    recebido: 'red',
    em_preparo: 'yellow',
    pronto: 'secondary',
    entregue: 'primary',
    finalizado: 'gray',
  };

interface WindowComWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Alerta curto via Web Audio API — sem depender de um arquivo de áudio novo.
// Navegadores bloqueiam autoplay de som sem gesto prévio do usuário: nesse
// caso a chamada só falha silenciosamente (o destaque visual do card novo
// continua funcionando). Uma vez que o lojista interaja com a página (clique
// em qualquer botão), o contexto de áudio já fica liberado pro navegador.
function tocarAlertaSonoro() {
  try {
    const AudioCtx = window.AudioContext ?? (window as WindowComWebkitAudio).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext indisponível ou bloqueado — sem alerta sonoro, o destaque visual basta.
  }
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

function PedidoCard({
  pedido,
  destacado,
  aoMudarStatus,
}: {
  pedido: PedidoAdmin;
  destacado: boolean;
  aoMudarStatus: (pedido: PedidoAdmin, status: StatusPedido) => void;
}) {
  const proximo = proximoStatus(pedido.status);
  const rotuloAcao = rotuloProximaAcao(pedido.status, pedido.formaRecebimento);

  return (
    <Card
      className={`flex flex-col gap-3 transition-shadow ${
        destacado ? 'ring-2 ring-primary shadow-card-hover' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-bold text-gray-800">#{pedido.numero}</span>
            <Badge cor={BADGE_COR_STATUS[pedido.status]}>
              {tituloCardPedido(pedido.status, pedido.formaRecebimento)}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{formatarTempoDecorrido(pedido.criadoEm)}</p>
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
          {formatarData(pedido.dataAgendamento)}
        </p>
      )}

      <div>
        <p className="font-medium text-gray-800">{pedido.clienteNome}</p>
        <p className="text-xs text-gray-500">{pedido.clienteTelefone}</p>
      </div>

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

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{detalhePagamento(pedido)}</span>
        <span className="font-semibold text-gray-800">R$ {pedido.total.toFixed(2)}</span>
      </div>

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

      <details className="group">
        <summary className="cursor-pointer list-none text-xs font-medium text-gray-400 transition-colors hover:text-gray-600">
          Alterar status manualmente
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {ORDEM_STATUS.map((status) => {
            const ativo = pedido.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => aoMudarStatus(pedido, status)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  ativo ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rotuloStatus(status, pedido.formaRecebimento)}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-gray-400">{formatarData(pedido.criadoEm)}</p>
      </details>
    </Card>
  );
}

export function PainelPedidos() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('agora');
  const [novosIds, setNovosIds] = useState<Set<string>>(new Set());
  const idsConhecidosRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api<PedidoAdmin[]>('/api/admin/pedidos', { autenticado: true });

        if (idsConhecidosRef.current) {
          const novos = resp.filter((p) => !idsConhecidosRef.current!.has(p.id));
          if (novos.length > 0) {
            tocarAlertaSonoro();
            setNovosIds((atual) => new Set([...atual, ...novos.map((p) => p.id)]));
            for (const pedido of novos) {
              setTimeout(() => {
                setNovosIds((atual) => {
                  const copia = new Set(atual);
                  copia.delete(pedido.id);
                  return copia;
                });
              }, 10_000);
            }
          }
        }
        idsConhecidosRef.current = new Set(resp.map((p) => p.id));
        setPedidos(resp);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
    // Sem WebSocket/listener em tempo real no backend hoje — polling reaproveita
    // o mesmo padrão já usado no acompanhamento público do cliente.
    const intervalo = setInterval(carregar, 12_000);
    return () => clearInterval(intervalo);
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

  const pedidosAgora = pedidos.filter(
    (p) => p.tipoPedido === 'imediato' && p.status !== 'finalizado',
  );
  const pedidosAgendados = pedidos
    .filter((p) => p.tipoPedido === 'agendado' && p.status !== 'finalizado')
    .sort(
      (a, b) =>
        new Date(a.dataAgendamento ?? a.criadoEm).getTime() -
        new Date(b.dataAgendamento ?? b.criadoEm).getTime(),
    );
  const pedidosFinalizados = pedidos.filter((p) => p.status === 'finalizado');

  const gruposAgendados = agruparPorData(pedidosAgendados);

  const ABAS: { chave: Aba; rotulo: string; contagem: number }[] = [
    { chave: 'agora', rotulo: 'Agora', contagem: pedidosAgora.length },
    { chave: 'agendados', rotulo: 'Agendados', contagem: pedidosAgendados.length },
    { chave: 'finalizados', rotulo: 'Finalizados', contagem: pedidosFinalizados.length },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-800">Pedidos</h2>

      <div className="flex gap-4 border-b">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => setAba(item.chave)}
            className={`px-1 pb-2 text-sm font-medium transition-colors ${
              aba === item.chave
                ? 'border-b-2 border-primary text-primary-hover'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.rotulo}
            {item.contagem > 0 ? ` (${item.contagem})` : ''}
          </button>
        ))}
      </div>

      {aba === 'agora' && (
        <>
          {pedidosAgora.length === 0 ? (
            <EmptyState
              icone="🧾"
              titulo="Nenhum pedido em andamento"
              descricao="Assim que um cliente fizer um pedido pra agora, ele aparece aqui."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {pedidosAgora.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  destacado={novosIds.has(pedido.id)}
                  aoMudarStatus={mudarStatus}
                />
              ))}
            </div>
          )}
        </>
      )}

      {aba === 'agendados' && (
        <>
          {pedidosAgendados.length === 0 ? (
            <EmptyState
              icone="📅"
              titulo="Nenhuma encomenda agendada"
              descricao="Pedidos agendados pelos clientes aparecem aqui, organizados por data."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {gruposAgendados.map((grupo) => (
                <div key={grupo.rotulo}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {grupo.rotulo}
                  </p>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                    {grupo.pedidos.map((pedido) => (
                      <PedidoCard
                        key={pedido.id}
                        pedido={pedido}
                        destacado={novosIds.has(pedido.id)}
                        aoMudarStatus={mudarStatus}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {aba === 'finalizados' && (
        <>
          {pedidosFinalizados.length === 0 ? (
            <EmptyState
              icone="🧾"
              titulo="Nenhum pedido finalizado"
              descricao="Pedidos marcados como Finalizado aparecem nessa aba."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {pedidosFinalizados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  destacado={false}
                  aoMudarStatus={mudarStatus}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
