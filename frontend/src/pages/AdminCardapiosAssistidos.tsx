import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { api, baixarArquivoCardapioAssistido } from '../lib/api';
import { SolicitacaoCardapioAssistidoAdmin, StatusSolicitacaoCardapio } from '../types';

const FILTROS: { chave: StatusSolicitacaoCardapio | 'todas'; rotulo: string }[] = [
  { chave: 'todas', rotulo: 'Todas' },
  { chave: 'recebido', rotulo: 'Recebido' },
  { chave: 'em_revisao', rotulo: 'Em revisão' },
  { chave: 'aguardando_lojista', rotulo: 'Aguardando lojista' },
  { chave: 'aprovado', rotulo: 'Aprovado' },
  { chave: 'concluido', rotulo: 'Concluído' },
];

const ROTULO_STATUS: Record<StatusSolicitacaoCardapio, string> = {
  recebido: 'Recebido',
  em_revisao: 'Em revisão',
  aguardando_lojista: 'Aguardando lojista',
  aprovado: 'Aprovado',
  concluido: 'Concluído',
};

const COR_STATUS: Record<StatusSolicitacaoCardapio, 'yellow' | 'secondary' | 'primary' | 'gray'> = {
  recebido: 'yellow',
  em_revisao: 'secondary',
  aguardando_lojista: 'yellow',
  aprovado: 'primary',
  concluido: 'gray',
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

export function AdminCardapiosAssistidos() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCardapioAssistidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<StatusSolicitacaoCardapio | 'todas'>('todas');
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const query = filtro !== 'todas' ? `?status=${filtro}` : '';
      const resp = await api<SolicitacaoCardapioAssistidoAdmin[]>(
        `/api/admin-master/cardapios-assistidos${query}`,
        { autenticado: true },
      );
      setSolicitacoes(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function abrirDetalhe(id: string) {
    setDetalheId(id);
    setArquivoUrl(null);
    setCarregandoArquivo(true);
    try {
      const blob = await baixarArquivoCardapioAssistido(id);
      setArquivoUrl(URL.createObjectURL(blob));
    } finally {
      setCarregandoArquivo(false);
    }
  }

  function fecharDetalhe() {
    if (arquivoUrl) URL.revokeObjectURL(arquivoUrl);
    setDetalheId(null);
    setArquivoUrl(null);
  }

  async function atualizarStatus(id: string, status: StatusSolicitacaoCardapio) {
    await api(`/api/admin-master/cardapios-assistidos/${id}/status`, {
      method: 'PATCH',
      autenticado: true,
      body: { status },
    });
    carregar();
  }

  const solicitacaoDetalhe = solicitacoes.find((s) => s.id === detalheId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Cardápios assistidos</h2>
        <Select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          className="w-auto"
        >
          {FILTROS.map((f) => (
            <option key={f.chave} value={f.chave}>
              {f.rotulo}
            </option>
          ))}
        </Select>
      </div>

      {carregando && <Loading />}

      {!carregando && solicitacoes.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma solicitação encontrada para esse filtro.</p>
      )}

      {!carregando && solicitacoes.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Loja</th>
                <th className="px-3 py-2.5">Origem</th>
                <th className="px-3 py-2.5">Arquivo</th>
                <th className="px-3 py-2.5">Data</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-800">{s.loja.nome}</p>
                    <p className="text-xs text-gray-500">/{s.loja.slug}</p>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {s.origem === 'pdf' ? 'PDF' : 'Imagem'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{s.nomeArquivoOriginal}</td>
                  <td className="px-3 py-2.5 text-gray-600">{formatarData(s.criadoEm)}</td>
                  <td className="px-3 py-2.5">
                    <Badge cor={COR_STATUS[s.status]}>{ROTULO_STATUS[s.status]}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => abrirDetalhe(s.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {solicitacaoDetalhe && (
        <Modal
          titulo={`Cardápio assistido — ${solicitacaoDetalhe.loja.nome}`}
          aoFechar={fecharDetalhe}
        >
          <div className="flex flex-col gap-3">
            <Link
              to={`/admin/lojas/${solicitacaoDetalhe.loja.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Ver detalhes da loja
            </Link>

            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                className="mt-1"
                value={solicitacaoDetalhe.status}
                onChange={(e) =>
                  atualizarStatus(
                    solicitacaoDetalhe.id,
                    e.target.value as StatusSolicitacaoCardapio,
                  )
                }
              >
                {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </Select>
            </div>

            {carregandoArquivo && <Loading label="Carregando arquivo..." />}
            {arquivoUrl && solicitacaoDetalhe.origem === 'imagem' && (
              <img src={arquivoUrl} alt="Cardápio enviado" className="w-full rounded-lg border" />
            )}
            {arquivoUrl && solicitacaoDetalhe.origem === 'pdf' && (
              <a
                href={arquivoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Abrir PDF em nova aba
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
