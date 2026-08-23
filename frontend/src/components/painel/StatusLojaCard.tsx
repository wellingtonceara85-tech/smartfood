import { Link } from 'react-router-dom';
import { AcaoStatusLoja, statusOperacionalLoja } from '../../lib/statusLoja';

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

const LINK_CLASSE = 'text-xs font-semibold text-primary-hover hover:underline';

function LinkAcao({ slug, acao }: { slug: string; acao: AcaoStatusLoja }) {
  if (acao.tipo === 'ver_loja') {
    // Cardápio público é outra origem/rota fora do painel — abre em nova aba
    // e usa o slug real da própria loja, nunca hardcoded.
    return (
      <a href={`/${slug}`} target="_blank" rel="noreferrer" className={LINK_CLASSE}>
        {acao.rotulo}
      </a>
    );
  }
  return (
    <Link to="/painel/loja" className={LINK_CLASSE}>
      {acao.rotulo}
    </Link>
  );
}

export function StatusLojaCard({ slug, aberto, abertoManual, compacto = false }: Props) {
  const status = statusOperacionalLoja({ aberto, abertoManual });

  if (compacto) {
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${CORES_POR_ICONE[status.icone]}`}
      >
        <span className="flex items-center gap-1.5 font-medium text-gray-800">
          <span aria-hidden="true">{status.icone}</span> {status.titulo}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {status.acoes.map((acao) => (
            <LinkAcao key={acao.tipo} slug={slug} acao={acao} />
          ))}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-card border p-3 ${CORES_POR_ICONE[status.icone]}`}>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        <span aria-hidden="true">{status.icone}</span> {status.titulo}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{status.descricao}</p>
      <div className="mt-1.5 flex items-center gap-3">
        {status.acoes.map((acao) => (
          <LinkAcao key={acao.tipo} slug={slug} acao={acao} />
        ))}
      </div>
    </div>
  );
}
