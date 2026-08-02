import { formatarValorEntrega } from '../lib/endereco';

interface Props {
  formaRecebimento: 'entrega' | 'retirada';
  bairroNome: string | null;
  valorEntrega: number;
  aoAlterar: () => void;
}

/**
 * Card compacto mostrado quando já existe uma preferência de entrega/retirada
 * em andamento — nunca o endereço completo (isso continua só dentro do
 * checkout). Deliberadamente pequeno: não é uma segunda barra fixa.
 */
export function CardEntregaTopo({ formaRecebimento, bairroNome, valorEntrega, aoAlterar }: Props) {
  if (formaRecebimento === 'entrega' && !bairroNome) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      {formaRecebimento === 'entrega' ? (
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            <span aria-hidden="true">📍</span> Entregar em
          </p>
          <p className="truncate text-sm font-semibold text-gray-800">{bairroNome}</p>
          <p className="text-xs text-gray-500">Entrega {formatarValorEntrega(valorEntrega)}</p>
        </div>
      ) : (
        <p className="text-sm font-medium text-gray-800">
          <span aria-hidden="true">🏪</span> Retirada no estabelecimento
        </p>
      )}
      <button
        type="button"
        onClick={aoAlterar}
        className="shrink-0 text-sm font-medium text-primary-hover hover:underline"
      >
        Alterar {formaRecebimento === 'entrega' ? 'endereço' : ''}
      </button>
    </div>
  );
}
