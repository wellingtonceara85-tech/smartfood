import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { api } from '../lib/api';
import { CategoriaSugestao, StatusSugestao, SugestaoLojistaAdmin } from '../types';

const ROTULO_STATUS: Record<StatusSugestao, string> = {
  nova: 'Nova',
  em_analise: 'Em análise',
  planejada: 'Planejada',
  implementada: 'Implementada',
  nao_planejada: 'Não planejada',
};

const COR_STATUS: Record<StatusSugestao, 'yellow' | 'secondary' | 'primary' | 'gray'> = {
  nova: 'yellow',
  em_analise: 'secondary',
  planejada: 'primary',
  implementada: 'primary',
  nao_planejada: 'gray',
};

const ROTULO_CATEGORIA: Record<CategoriaSugestao, string> = {
  cardapio: 'Cardápio',
  pedidos: 'Pedidos',
  financeiro: 'Financeiro',
  entregas: 'Entregas',
  relatorios: 'Relatórios',
  outro: 'Outro',
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function AdminFeedback() {
  const [sugestoes, setSugestoes] = useState<SugestaoLojistaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusSugestao | 'todas'>('todas');

  async function carregar() {
    setCarregando(true);
    try {
      const query = filtroStatus !== 'todas' ? `?status=${filtroStatus}` : '';
      const resp = await api<SugestaoLojistaAdmin[]>(`/api/admin-master/sugestoes${query}`, {
        autenticado: true,
      });
      setSugestoes(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  async function atualizarStatus(id: string, status: StatusSugestao) {
    await api(`/api/admin-master/sugestoes/${id}/status`, {
      method: 'PATCH',
      autenticado: true,
      body: { status },
    });
    carregar();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Feedback dos lojistas</h2>
        <Select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
          className="w-auto"
        >
          <option value="todas">Todas</option>
          {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </Select>
      </div>

      {carregando && <Loading />}
      {!carregando && sugestoes.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma sugestão encontrada para esse filtro.</p>
      )}

      <div className="flex flex-col gap-2">
        {sugestoes.map((s) => (
          <Card key={s.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  to={`/admin/lojas/${s.loja.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {s.loja.nome}
                </Link>
                <span className="ml-2 text-xs text-gray-400">{formatarData(s.criadoEm)}</span>
              </div>
              <Badge cor="gray">{ROTULO_CATEGORIA[s.categoria]}</Badge>
            </div>
            <p className="text-sm text-gray-700">{s.mensagem}</p>
            <div className="flex items-center gap-2">
              <Badge cor={COR_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</Badge>
              <Select
                value={s.status}
                onChange={(e) => atualizarStatus(s.id, e.target.value as StatusSugestao)}
                className="w-auto text-xs"
              >
                {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
