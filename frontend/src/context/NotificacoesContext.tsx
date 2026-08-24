import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api } from '../lib/api';
import {
  adicionarNotificacoes,
  contarNaoLidas,
  criarNotificacaoAgendamentoProximo,
  criarNotificacaoNovoPedido,
  DESTAQUE_PEDIDO_NOVO_MS,
  detectarAgendamentosProximos,
  detectarPedidosNovos,
  INTERVALO_POLLING_PEDIDOS_MS,
  marcarTodasComoLidas,
  NotificacaoPainel,
} from '../lib/notificacoes';
import { lerPreferenciaSom, salvarPreferenciaSom, tocarAlertaSonoro } from '../lib/somPedido';
import { PedidoAdmin } from '../types';

interface NotificacoesContextValue {
  pedidos: PedidoAdmin[];
  carregandoPedidos: boolean;
  novosIds: Set<string>;
  notificacoes: NotificacaoPainel[];
  naoLidas: number;
  somAtivado: boolean;
  alternarSom: () => void;
  permissaoNotificacao: NotificationPermission | 'indisponivel';
  pedirPermissaoNotificacao: () => void;
  marcarNotificacoesComoLidas: () => void;
  ultimoPedidoNovo: PedidoAdmin | null;
  atualizarPedidoLocal: (pedido: PedidoAdmin) => void;
}

const NotificacoesContext = createContext<NotificacoesContextValue | undefined>(undefined);

/** Não expõe telefone/endereço do cliente — só o essencial pra identificar o pedido no SO. */
function notificarSistemaOperacional(pedido: PedidoAdmin) {
  try {
    new Notification('Novo pedido recebido', {
      body: `Pedido #${pedido.numero} • R$ ${pedido.total.toFixed(2)}`,
      tag: `smartfood-pedido-${pedido.id}`,
      icon: '/icons/icon-192.png',
    });
  } catch {
    // Notification indisponível/bloqueada — a Central dentro do app já cobre o aviso.
  }
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [novosIds, setNovosIds] = useState<Set<string>>(new Set());
  const [notificacoes, setNotificacoes] = useState<NotificacaoPainel[]>([]);
  const [somAtivado, setSomAtivado] = useState(lerPreferenciaSom);
  const [ultimoPedidoNovo, setUltimoPedidoNovo] = useState<PedidoAdmin | null>(null);
  const [permissaoNotificacao, setPermissaoNotificacao] = useState<
    NotificationPermission | 'indisponivel'
  >(typeof Notification === 'undefined' ? 'indisponivel' : Notification.permission);

  const idsConhecidosRef = useRef<Set<string> | null>(null);
  const idsAgendamentoNotificadosRef = useRef<Set<string>>(new Set());

  const buscarPedidos = useCallback(async () => {
    try {
      const resp = await api<PedidoAdmin[]>('/api/admin/pedidos', { autenticado: true });

      const pedidosNovos = detectarPedidosNovos(resp, idsConhecidosRef.current);
      const agendamentosProximos = detectarAgendamentosProximos(
        resp,
        idsAgendamentoNotificadosRef.current,
        new Date(),
      );

      if (pedidosNovos.length > 0) {
        if (lerPreferenciaSom()) tocarAlertaSonoro();
        setNovosIds((atual) => new Set([...atual, ...pedidosNovos.map((p) => p.id)]));
        setUltimoPedidoNovo(pedidosNovos[pedidosNovos.length - 1]);

        for (const p of pedidosNovos) {
          setTimeout(() => {
            setNovosIds((atual) => {
              const copia = new Set(atual);
              copia.delete(p.id);
              return copia;
            });
          }, DESTAQUE_PEDIDO_NOVO_MS);
        }

        if (Notification?.permission === 'granted' && document.hidden) {
          for (const p of pedidosNovos) notificarSistemaOperacional(p);
        }
      }

      for (const p of agendamentosProximos) idsAgendamentoNotificadosRef.current.add(p.id);

      const novasNotificacoes = [
        ...pedidosNovos.map((p) => criarNotificacaoNovoPedido(p)),
        ...agendamentosProximos.map((p) => criarNotificacaoAgendamentoProximo(p)),
      ];
      if (novasNotificacoes.length > 0) {
        setNotificacoes((atuais) => adicionarNotificacoes(atuais, novasNotificacoes));
      }

      idsConhecidosRef.current = new Set(resp.map((p) => p.id));
      setPedidos(resp);
    } finally {
      setCarregandoPedidos(false);
    }
  }, []);

  useEffect(() => {
    buscarPedidos();
    // Único polling do recurso "pedidos" no painel inteiro — Dashboard, Pedidos
    // e o sino leem daqui, nenhuma tela mais faz o próprio setInterval.
    const intervalo = setInterval(buscarPedidos, INTERVALO_POLLING_PEDIDOS_MS);
    return () => clearInterval(intervalo);
  }, [buscarPedidos]);

  function alternarSom() {
    setSomAtivado((atual) => {
      const novo = !atual;
      salvarPreferenciaSom(novo);
      return novo;
    });
  }

  function pedirPermissaoNotificacao() {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then(setPermissaoNotificacao);
  }

  function marcarNotificacoesComoLidas() {
    setNotificacoes((atuais) => marcarTodasComoLidas(atuais));
  }

  function atualizarPedidoLocal(pedidoAtualizado: PedidoAdmin) {
    setPedidos((atuais) =>
      atuais.map((p) => (p.id === pedidoAtualizado.id ? pedidoAtualizado : p)),
    );
  }

  return (
    <NotificacoesContext.Provider
      value={{
        pedidos,
        carregandoPedidos,
        novosIds,
        notificacoes,
        naoLidas: contarNaoLidas(notificacoes),
        somAtivado,
        alternarSom,
        permissaoNotificacao,
        pedirPermissaoNotificacao,
        marcarNotificacoesComoLidas,
        ultimoPedidoNovo,
        atualizarPedidoLocal,
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContext);
  if (!contexto) throw new Error('useNotificacoes precisa estar dentro de NotificacoesProvider');
  return contexto;
}
