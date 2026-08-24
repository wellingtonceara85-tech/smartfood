import { useEffect, useRef, useState } from 'react';
import { formatarAgendamentoCurto } from '../../lib/agendaProxima';
import { formatarTempoDecorrido } from '../../lib/tempo';
import { useNotificacoes } from '../../context/NotificacoesContext';
import { NotificacaoPainel } from '../../lib/notificacoes';

function textoNotificacao(notificacao: NotificacaoPainel): {
  icone: string;
  titulo: string;
  detalhe: string;
} {
  if (notificacao.tipo === 'novo_pedido') {
    return {
      icone: '🛒',
      titulo: `Novo pedido #${notificacao.numero}`,
      detalhe: `R$ ${notificacao.total.toFixed(2)}`,
    };
  }
  return {
    icone: '📅',
    titulo: `Pedido #${notificacao.numero} se aproxima`,
    detalhe: notificacao.dataAgendamento
      ? `Agendado para ${formatarAgendamentoCurto(notificacao.dataAgendamento)}`
      : 'Agendamento se aproximando',
  };
}

function ItemPermissaoNotificacao() {
  const { permissaoNotificacao, pedirPermissaoNotificacao } = useNotificacoes();

  if (permissaoNotificacao === 'indisponivel') {
    return (
      <p className="text-xs text-gray-400">
        Notificações do navegador não são suportadas neste dispositivo.
      </p>
    );
  }
  if (permissaoNotificacao === 'granted') {
    return <p className="text-xs text-primary-hover">✅ Notificações do navegador ativadas</p>;
  }
  if (permissaoNotificacao === 'denied') {
    return (
      <p className="text-xs text-gray-400">
        Notificações bloqueadas pelo navegador — ative nas configurações do site pra receber.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={pedirPermissaoNotificacao}
      className="text-xs font-semibold text-primary-hover hover:underline"
    >
      Ativar notificações do navegador
    </button>
  );
}

export function SininhoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notificacoes, naoLidas, somAtivado, alternarSom, marcarNotificacoesComoLidas } =
    useNotificacoes();

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  function alternarAberto() {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    if (novoEstado) marcarNotificacoesComoLidas();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={alternarAberto}
        aria-label="Notificações"
        aria-expanded={aberto}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-gray-600 transition-colors hover:bg-gray-100"
      >
        <span aria-hidden="true">🔔</span>
        {naoLidas > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-card border border-gray-200 bg-white shadow-card-hover"
        >
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Notificações</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                Você não tem novas notificações.
              </p>
            ) : (
              <ul>
                {notificacoes.map((notificacao) => {
                  const { icone, titulo, detalhe } = textoNotificacao(notificacao);
                  return (
                    <li key={notificacao.id} className="border-b px-4 py-2.5 last:border-b-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                        <span aria-hidden="true">{icone}</span> {titulo}
                      </p>
                      <p className="text-xs text-gray-500">{detalhe}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {formatarTempoDecorrido(new Date(notificacao.criadoEm).toISOString())}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t px-4 py-3">
            <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
              <span>{somAtivado ? '🔊 Som de novos pedidos ativado' : '🔇 Som desativado'}</span>
              <input
                type="checkbox"
                checked={somAtivado}
                onChange={alternarSom}
                aria-label="Som de novos pedidos"
                className="h-4 w-4 accent-primary"
              />
            </label>
            <ItemPermissaoNotificacao />
          </div>
        </div>
      )}
    </div>
  );
}
