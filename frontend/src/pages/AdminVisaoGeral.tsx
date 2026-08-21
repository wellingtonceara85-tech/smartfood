import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { api } from '../lib/api';
import { OverviewAdminMaster } from '../types';

interface StatCardProps {
  titulo: string;
  valor: string;
  destaque?: 'atencao' | 'alerta';
}

function StatCard({ titulo, valor, destaque }: StatCardProps) {
  const cor =
    destaque === 'alerta'
      ? 'text-red-600'
      : destaque === 'atencao'
        ? 'text-yellow-600'
        : 'text-gray-800';
  return (
    <Card>
      <p className="text-xs font-medium text-gray-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${cor}`}>{valor}</p>
    </Card>
  );
}

export function AdminVisaoGeral() {
  const [dados, setDados] = useState<OverviewAdminMaster | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api<OverviewAdminMaster>('/api/admin-master/overview', { autenticado: true })
      .then(setDados)
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <Loading />;
  if (!dados) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">Visão geral</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard titulo="Total de lojas" valor={String(dados.totalLojas)} />
        <StatCard titulo="Ativas" valor={String(dados.ativas)} />
        <StatCard titulo="Aguardando ativação" valor={String(dados.aguardandoAtivacao)} />
        <StatCard
          titulo="Suspensas"
          valor={String(dados.suspensas)}
          destaque={dados.suspensas > 0 ? 'alerta' : undefined}
        />
        <StatCard titulo="Lojistas com uso recente" valor={String(dados.lojistasComUsoRecente)} />
        <StatCard titulo="Total de pedidos" valor={String(dados.totalPedidos)} />
        <StatCard titulo="Valor movimentado" valor={`R$ ${dados.valorMovimentado.toFixed(2)}`} />
        <StatCard
          titulo="Trials vencendo em 7 dias"
          valor={String(dados.trialsVencendoEm7Dias)}
          destaque={dados.trialsVencendoEm7Dias > 0 ? 'atencao' : undefined}
        />
        <StatCard
          titulo="Trials expirados"
          valor={String(dados.trialsExpirados)}
          destaque={dados.trialsExpirados > 0 ? 'alerta' : undefined}
        />
      </div>

      <p className="text-xs text-gray-400">
        "Lojistas com uso recente" considera login nos últimos 7 dias. Sessões simultâneas por
        dispositivo não são rastreadas — ver{' '}
        <Link to="/admin/lojas" className="underline">
          Lojas
        </Link>{' '}
        para o último acesso individual de cada loja.
      </p>
    </div>
  );
}
