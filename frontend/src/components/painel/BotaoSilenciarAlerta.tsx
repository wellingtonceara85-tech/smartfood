import { useNotificacoes } from '../../context/NotificacoesContext';

/**
 * Só aparece enquanto o alerta sonoro persistente está tocando — dá uma
 * forma evidente de parar o som atual sem mexer no pedido nem desligar a
 * repetição futura (ver `silenciarAlerta` em NotificacoesContext).
 */
export function BotaoSilenciarAlerta() {
  const { alertaTocando, silenciarAlerta } = useNotificacoes();

  if (!alertaTocando) return null;

  return (
    <button
      type="button"
      onClick={silenciarAlerta}
      className="fixed inset-x-4 z-40 mx-auto flex max-w-xs items-center justify-center gap-2 rounded-full bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white shadow-card-hover"
      style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
    >
      <span aria-hidden="true">🔕</span> Silenciar alerta
    </button>
  );
}
