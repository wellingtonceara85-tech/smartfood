import { useState } from 'react';
import { Button } from '../ui/Button';
import { PedidoAdmin } from '../../types';

const MOTIVOS_SUGERIDOS = [
  'Produto indisponível',
  'Loja sem capacidade para atender',
  'Cliente solicitou cancelamento',
  'Problema com pagamento',
  'Endereço fora da área',
  'Outro',
];

interface Props {
  pedido: PedidoAdmin;
  aoConfirmar: (motivo: string) => Promise<void> | void;
  aoFechar: () => void;
}

export function ModalCancelarPedido({ pedido, aoConfirmar, aoFechar }: Props) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string | null>(null);
  const [motivoOutro, setMotivoOutro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const motivoFinal =
    motivoSelecionado === 'Outro' ? motivoOutro.trim() : (motivoSelecionado ?? '').trim();
  const motivoValido = motivoFinal.length >= 3;

  async function confirmar() {
    if (!motivoValido || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await aoConfirmar(motivoFinal);
    } catch {
      setErro('Não foi possível cancelar o pedido agora. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cancelar pedido #${pedido.numero}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-sm rounded-t-card bg-white p-4 shadow-card-hover sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-800">Cancelar pedido #{pedido.numero}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Essa ação avisa que o pedido não vai ser atendido. Informe o motivo abaixo.
        </p>

        <p className="mt-4 text-sm font-medium text-gray-700">Motivo do cancelamento *</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {MOTIVOS_SUGERIDOS.map((motivo) => (
            <label
              key={motivo}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                motivoSelecionado === motivo
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="motivo-cancelamento"
                checked={motivoSelecionado === motivo}
                onChange={() => setMotivoSelecionado(motivo)}
                className="h-4 w-4 accent-red-600"
              />
              {motivo}
            </label>
          ))}
        </div>

        {motivoSelecionado === 'Outro' && (
          <textarea
            value={motivoOutro}
            onChange={(e) => setMotivoOutro(e.target.value)}
            placeholder="Descreva o motivo do cancelamento"
            maxLength={300}
            rows={3}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}

        {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variante="secondary"
            className="flex-1 justify-center"
            onClick={aoFechar}
            disabled={enviando}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variante="danger"
            className="flex-1 justify-center"
            onClick={confirmar}
            disabled={!motivoValido || enviando}
          >
            {enviando ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
