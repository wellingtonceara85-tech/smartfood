import { useState } from 'react';
import { CentralOperacional } from '../components/painel/CentralOperacional';
import { ModalCancelarPedido } from '../components/painel/ModalCancelarPedido';
import { PedidoCard } from '../components/painel/PedidoCard';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Loading } from '../components/ui/Loading';
import { useNotificacoes } from '../context/NotificacoesContext';
import { api } from '../lib/api';
import { proximidadeAgendamento } from '../lib/agendaProxima';
import { PedidoAdmin, StatusPedido } from '../types';

type Aba = 'agora' | 'agendados' | 'finalizados';

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

export function PainelPedidos() {
  const { pedidos, carregandoPedidos, novosIds, atualizarPedidoLocal } = useNotificacoes();
  const [aba, setAba] = useState<Aba>('agora');
  const [pedidoCancelando, setPedidoCancelando] = useState<PedidoAdmin | null>(null);
  const [erroTransicao, setErroTransicao] = useState<string | null>(null);

  async function mudarStatus(pedido: PedidoAdmin, status: StatusPedido) {
    try {
      // Só atualiza a UI depois da resposta do backend — ele é a autoridade da
      // transição (drag/botão nunca move o card por conta própria); em erro,
      // o card simplesmente nunca muda de coluna/estado.
      const atualizado = await api<PedidoAdmin>(`/api/admin/pedidos/${pedido.id}/status`, {
        method: 'PATCH',
        autenticado: true,
        body: { status },
      });
      atualizarPedidoLocal(atualizado);
      setErroTransicao(null);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : null;
      setErroTransicao(
        mensagem
          ? `Pedido #${pedido.numero}: ${mensagem}`
          : `Não foi possível mover o pedido #${pedido.numero}. Tente de novo.`,
      );
      setTimeout(() => setErroTransicao(null), 5000);
    }
  }

  async function confirmarCancelamento(motivo: string) {
    if (!pedidoCancelando) return;
    const atualizado = await api<PedidoAdmin>(
      `/api/admin/pedidos/${pedidoCancelando.id}/cancelar`,
      {
        method: 'POST',
        autenticado: true,
        body: { motivo },
      },
    );
    atualizarPedidoLocal(atualizado);
    setPedidoCancelando(null);
  }

  if (carregandoPedidos) return <Loading />;

  const agora = new Date();

  const pedidosAgoraImediatos = pedidos.filter(
    (p) => p.tipoPedido === 'imediato' && p.status !== 'finalizado',
  );
  // Agendado que já entrou na janela operacional (mesmo limiar usado no Dashboard e nas
  // notificações — ver agendaProxima.ts) aparece também na Central, sem sair da aba Agendados.
  const pedidosAgendadosNaJanela = pedidos.filter((p) => {
    if (p.tipoPedido !== 'agendado' || !p.dataAgendamento || p.status === 'finalizado') {
      return false;
    }
    const proximidade = proximidadeAgendamento(p.dataAgendamento, agora);
    return proximidade === 'atrasado' || proximidade === 'proximo';
  });
  const pedidosOperacionais = [...pedidosAgoraImediatos, ...pedidosAgendadosNaJanela];

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
    { chave: 'agora', rotulo: 'Agora', contagem: pedidosOperacionais.length },
    { chave: 'agendados', rotulo: 'Agendados', contagem: pedidosAgendados.length },
    { chave: 'finalizados', rotulo: 'Finalizados', contagem: pedidosFinalizados.length },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-800">Pedidos</h2>

      {erroTransicao && <Alert tipo="erro">{erroTransicao}</Alert>}

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
        <CentralOperacional
          pedidos={pedidosOperacionais}
          novosIds={novosIds}
          aoMudarStatus={mudarStatus}
          aoAbrirCancelamento={setPedidoCancelando}
        />
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
                        aoCancelar={setPedidoCancelando}
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

      {pedidoCancelando && (
        <ModalCancelarPedido
          pedido={pedidoCancelando}
          aoConfirmar={confirmarCancelamento}
          aoFechar={() => setPedidoCancelando(null)}
        />
      )}
    </div>
  );
}
