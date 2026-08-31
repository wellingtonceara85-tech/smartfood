import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ApiError, api } from '../../lib/api';

interface Props {
  segmentoNegocio: string | null;
  aoConcluir: () => void;
}

export function CardapioGuiado({ segmentoNegocio, aoConcluir }: Props) {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!segmentoNegocio) {
      setCarregando(false);
      return;
    }
    api<{ categorias: string[] }>(
      `/api/admin/onboarding/sugestoes-categorias?segmento=${segmentoNegocio}`,
      { autenticado: true },
    )
      .then((resp) => setCategorias(resp.categorias))
      .finally(() => setCarregando(false));
  }, [segmentoNegocio]);

  function remover(nome: string) {
    setCategorias((atual) => atual.filter((c) => c !== nome));
  }

  function adicionar() {
    const nome = novaCategoria.trim();
    if (!nome || categorias.includes(nome)) return;
    setCategorias((atual) => [...atual, nome]);
    setNovaCategoria('');
  }

  async function concluir() {
    if (categorias.length === 0) return;
    setEnviando(true);
    setErro(null);
    try {
      await api('/api/admin/onboarding/categorias-guiadas', {
        method: 'POST',
        autenticado: true,
        body: { nomes: categorias },
      });
      aoConcluir();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao criar categorias');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando sugestões...</p>;

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Sugerimos essas categorias com base no que você vende. Remova o que não usar, ou adicione
        outras — nenhum produto é criado automaticamente, só os nomes das categorias.
      </p>

      <ul className="flex flex-col gap-2">
        {categorias.map((nome) => (
          <li
            key={nome}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {nome}
            <button
              type="button"
              onClick={() => remover(nome)}
              aria-label={`Remover ${nome}`}
              className="text-gray-400 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
        {categorias.length === 0 && (
          <li className="text-sm text-gray-400">Nenhuma categoria selecionada ainda.</li>
        )}
      </ul>

      <div className="flex gap-2">
        <Input
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          placeholder="Nome de outra categoria"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <Button type="button" variante="secondary" onClick={adicionar}>
          Adicionar
        </Button>
      </div>

      {erro && <Alert tipo="erro">{erro}</Alert>}

      <Button type="button" disabled={enviando || categorias.length === 0} onClick={concluir}>
        {enviando ? 'Criando...' : 'Criar categorias e ir para os produtos'}
      </Button>
    </Card>
  );
}
