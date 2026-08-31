import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { api, enviarFoto } from '../../lib/api';
import { Produto } from '../../types';

interface Props {
  aoContinuar: () => void;
}

export function EtapaFotos({ aoContinuar }: Props) {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  useEffect(() => {
    api<Produto[]>('/api/admin/produtos', { autenticado: true }).then(setProdutos);
  }, []);

  async function aoSelecionarFoto(produto: Produto, arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviandoId(produto.id);
    try {
      const fotoUrl = await enviarFoto(arquivo);
      await api(`/api/admin/produtos/${produto.id}`, {
        method: 'PUT',
        autenticado: true,
        body: { fotoUrl },
      });
      setProdutos(
        (atual) => atual?.map((p) => (p.id === produto.id ? { ...p, fotoUrl } : p)) ?? null,
      );
    } finally {
      setEnviandoId(null);
    }
  }

  if (!produtos) return <Loading />;

  const semFoto = produtos.filter((p) => !p.fotoUrl);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        {semFoto.length === 0
          ? 'Todos os seus produtos já têm foto!'
          : `${semFoto.length} ${semFoto.length === 1 ? 'produto está' : 'produtos estão'} sem foto. Fotos deixam o cardápio mais atrativo, mas você pode adicionar depois.`}
      </p>

      <div className="flex flex-col gap-2">
        {semFoto.map((produto) => (
          <Card key={produto.id} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-800">{produto.nome}</span>
            <label className="shrink-0 cursor-pointer text-xs font-medium text-primary-hover underline">
              {enviandoId === produto.id ? 'Enviando...' : 'Adicionar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={enviandoId !== null}
                onChange={(e) => aoSelecionarFoto(produto, e.target.files?.[0])}
              />
            </label>
          </Card>
        ))}
      </div>

      <Button type="button" onClick={aoContinuar}>
        {semFoto.length === 0 ? 'Continuar' : 'Deixar para depois'}
      </Button>
    </div>
  );
}
