import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { api } from '../../lib/api';
import { MetodoCardapio, Pendencia, Produto } from '../../types';

interface Props {
  slug: string;
  metodoCardapio: MetodoCardapio | null;
}

export function EtapaConclusao({ slug, metodoCardapio }: Props) {
  const navigate = useNavigate();
  const [pendencias, setPendencias] = useState<Pendencia[] | null>(null);
  const [totalProdutos, setTotalProdutos] = useState<number | null>(null);

  useEffect(() => {
    api<{ pendencias: Pendencia[] }>('/api/admin/pendencias', { autenticado: true }).then((resp) =>
      setPendencias(resp.pendencias),
    );
    api<Produto[]>('/api/admin/produtos', { autenticado: true }).then((produtos) =>
      setTotalProdutos(produtos.length),
    );
  }, []);

  if (pendencias === null || totalProdutos === null) return <Loading />;

  const cardapioEmAnalise = metodoCardapio === 'arquivo';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-3xl">🎉</p>
      <h2 className="text-lg font-semibold text-gray-800">Sua loja está pronta!</h2>

      <Card className="flex flex-col gap-2">
        <ChecklistItem ok titulo="Dados da loja" />
        <ChecklistItem ok titulo="Funcionamento" />
        {cardapioEmAnalise ? (
          <ChecklistItem
            ok={false}
            titulo="Cardápio em análise — nossa equipe vai revisar e te avisar quando estiver pronto"
          />
        ) : (
          <ChecklistItem
            ok={totalProdutos > 0}
            titulo={
              totalProdutos > 0
                ? `Cardápio com ${totalProdutos} ${totalProdutos === 1 ? 'produto' : 'produtos'}`
                : 'Nenhum produto cadastrado ainda'
            }
          />
        )}
        {pendencias.map((pendencia) => (
          <ChecklistItem key={pendencia.chave} ok={false} titulo={pendencia.titulo} />
        ))}
      </Card>

      <div className="flex flex-col gap-2">
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ver meu cardápio
        </a>
        <Button type="button" onClick={() => navigate('/painel/dashboard', { replace: true })}>
          Ir para o painel
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({ ok, titulo }: { ok: boolean; titulo: string }) {
  return (
    <p className="flex items-start gap-2 text-sm text-gray-700">
      <span aria-hidden="true">{ok ? '✅' : '⚠️'}</span>
      {titulo}
    </p>
  );
}
