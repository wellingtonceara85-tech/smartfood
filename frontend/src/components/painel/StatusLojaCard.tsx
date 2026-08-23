import { Link } from 'react-router-dom';
import { statusOperacionalLoja } from '../../lib/statusLoja';

interface Props {
  slug: string;
  aberto: boolean;
  abertoManual: boolean | null;
  /** Versão compacta (uma linha) usada no topo do Dashboard mobile — a sidebar usa o card completo. */
  compacto?: boolean;
}

const CORES_POR_ICONE: Record<string, string> = {
  '🟢': 'border-primary/30 bg-primary-light/60',
  '🔴': 'border-red-200 bg-red-50',
  '🟠': 'border-orange-200 bg-orange-50',
};

export function StatusLojaCard({ slug, aberto, abertoManual, compacto = false }: Props) {
  const status = statusOperacionalLoja({ aberto, abertoManual });
  const destino = status.acao.tipo === 'ver_loja' ? `/${slug}` : '/painel/loja';
  const abreEmNovaAba = status.acao.tipo === 'ver_loja';

  if (compacto) {
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${CORES_POR_ICONE[status.icone]}`}
      >
        <span className="flex items-center gap-1.5 font-medium text-gray-800">
          <span aria-hidden="true">{status.icone}</span> {status.titulo}
        </span>
        {abreEmNovaAba ? (
          <a
            href={destino}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-semibold text-primary-hover hover:underline"
          >
            {status.acao.rotulo}
          </a>
        ) : (
          <Link
            to={destino}
            className="shrink-0 text-xs font-semibold text-primary-hover hover:underline"
          >
            {status.acao.rotulo}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-card border p-3 ${CORES_POR_ICONE[status.icone]}`}>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        <span aria-hidden="true">{status.icone}</span> {status.titulo}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{status.descricao}</p>
      {abreEmNovaAba ? (
        <a
          href={destino}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-primary-hover hover:underline"
        >
          {status.acao.rotulo}
        </a>
      ) : (
        <Link
          to={destino}
          className="mt-1.5 inline-block text-xs font-semibold text-primary-hover hover:underline"
        >
          {status.acao.rotulo}
        </Link>
      )}
    </div>
  );
}
