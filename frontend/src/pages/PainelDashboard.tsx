import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { ProximosPedidos } from '../components/painel/ProximosPedidos';
import { StatusLojaCard } from '../components/painel/StatusLojaCard';
import { useAuth } from '../context/AuthContext';
import { useNotificacoes } from '../context/NotificacoesContext';
import { contarPedidosPrecisandoAtencao } from '../lib/agendaProxima';
import { api } from '../lib/api';
import { resumoOperacional } from '../lib/resumoOperacional';
import { nomeParaSaudacao, saudacaoPorHora } from '../lib/saudacao';
import { PainelLayoutContexto } from './PainelLayout';
import { DashboardResumo, Pendencia, Produto } from '../types';

function formatarISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function hojeISO(): string {
  return formatarISO(new Date());
}

function diasAtrasISO(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return formatarISO(data);
}

function inicioDoMesISO(): string {
  const agora = new Date();
  return formatarISO(new Date(agora.getFullYear(), agora.getMonth(), 1));
}

interface StatCardProps {
  titulo: string;
  valor: string;
}

function StatCard({ titulo, valor }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs font-medium text-gray-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{valor}</p>
    </Card>
  );
}

export function PainelDashboard() {
  const { loja } = useOutletContext<PainelLayoutContexto>();
  const { usuario } = useAuth();
  const { pedidos, carregandoPedidos, novosIds } = useNotificacoes();
  const [dataInicio, setDataInicio] = useState(hojeISO());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [periodoAtivo, setPeriodoAtivo] = useState<'hoje' | '7dias' | 'mes' | 'custom'>('hoje');
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [totalProdutos, setTotalProdutos] = useState<number | null>(null);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api<DashboardResumo>(`/api/admin/dashboard?inicio=${dataInicio}&fim=${dataFim}`, {
      autenticado: true,
    })
      .then(setResumo)
      .finally(() => setCarregando(false));
  }, [dataInicio, dataFim]);

  useEffect(() => {
    api<Produto[]>('/api/admin/produtos', { autenticado: true }).then((produtos) => {
      setTotalProdutos(produtos.length);
    });
    api<{ pendencias: Pendencia[] }>('/api/admin/pendencias', { autenticado: true }).then((resp) =>
      setPendencias(resp.pendencias),
    );
  }, []);

  function aplicarPeriodo(inicio: string, fim: string, chave: typeof periodoAtivo) {
    setDataInicio(inicio);
    setDataFim(fim);
    setPeriodoAtivo(chave);
  }

  const botaoPeriodo = (chave: typeof periodoAtivo) =>
    periodoAtivo === chave ? 'primary' : 'secondary';

  const pedidosEmPreparo = carregandoPedidos
    ? null
    : pedidos.filter((p) => p.status === 'em_preparo').length;

  const agora = Date.now();
  const em7Dias = agora + 7 * 24 * 60 * 60 * 1000;
  const encomendasProximas = carregandoPedidos
    ? null
    : pedidos.filter((p) => {
        if (p.tipoPedido !== 'agendado' || p.status === 'finalizado' || !p.dataAgendamento) {
          return false;
        }
        const dataAgendamento = new Date(p.dataAgendamento).getTime();
        return dataAgendamento >= agora && dataAgendamento <= em7Dias;
      }).length;

  const nome = nomeParaSaudacao(usuario?.nome, loja?.nome);
  const resumoOp = loja
    ? resumoOperacional({
        aberto: loja.aberto,
        pedidosPrecisandoAtencao: contarPedidosPrecisandoAtencao(pedidos),
      })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {saudacaoPorHora(new Date().getHours())}
          {nome ? `, ${nome}` : ''} <span aria-hidden="true">👋</span>
        </h2>
        {resumoOp && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600">
            <span aria-hidden="true">{resumoOp.icone}</span> {resumoOp.mensagem}
          </p>
        )}
      </div>

      {loja && (
        <div className="lg:hidden">
          <StatusLojaCard
            slug={loja.slug}
            aberto={loja.aberto}
            abertoManual={loja.abertoManual}
            compacto
          />
        </div>
      )}

      {pendencias.length > 0 && (
        <Card className="border border-yellow-200 bg-yellow-50">
          <p className="font-semibold text-gray-800">
            <span aria-hidden="true">🚀</span> Deixe sua loja pronta para vender mais
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {pendencias.map((pendencia) => (
              <li key={pendencia.chave}>
                <Link
                  to={pendencia.rota}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <span>
                    <span className="text-sm font-medium text-gray-800">{pendencia.titulo}</span>
                    <span className="block text-xs text-gray-500">{pendencia.descricao}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary">Resolver →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ProximosPedidos pedidos={pedidos} novosIds={novosIds} />

      <Card className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              setPeriodoAtivo('custom');
            }}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setPeriodoAtivo('custom');
            }}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            tamanho="sm"
            variante={botaoPeriodo('hoje')}
            onClick={() => aplicarPeriodo(hojeISO(), hojeISO(), 'hoje')}
          >
            Hoje
          </Button>
          <Button
            type="button"
            tamanho="sm"
            variante={botaoPeriodo('7dias')}
            onClick={() => aplicarPeriodo(diasAtrasISO(6), hojeISO(), '7dias')}
          >
            7 dias
          </Button>
          <Button
            type="button"
            tamanho="sm"
            variante={botaoPeriodo('mes')}
            onClick={() => aplicarPeriodo(inicioDoMesISO(), hojeISO(), 'mes')}
          >
            Este mês
          </Button>
        </div>
      </Card>

      {carregando && <Loading />}

      {!carregando && resumo && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard titulo="Faturamento" valor={`R$ ${resumo.faturamentoTotal.toFixed(2)}`} />
            <StatCard titulo="Pedidos no período" valor={String(resumo.totalPedidos)} />
            <StatCard titulo="Ticket médio" valor={`R$ ${resumo.ticketMedio.toFixed(2)}`} />
            <StatCard
              titulo="Pedidos em preparo"
              valor={pedidosEmPreparo === null ? '—' : String(pedidosEmPreparo)}
            />
            <StatCard
              titulo="Produtos cadastrados"
              valor={totalProdutos === null ? '—' : String(totalProdutos)}
            />
          </div>

          {!!encomendasProximas && encomendasProximas > 0 && (
            <Link
              to="/painel/pedidos"
              className="flex items-center justify-between gap-3 rounded-card bg-secondary-light px-4 py-3 text-secondary-hover shadow-card transition-colors hover:opacity-90"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden="true">📅</span>
                {encomendasProximas}{' '}
                {encomendasProximas === 1 ? 'encomenda agendada' : 'encomendas agendadas'} nos
                próximos 7 dias
              </span>
              <span className="text-sm font-semibold underline underline-offset-2">
                Ver pedidos
              </span>
            </Link>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card>
              <p className="text-xs font-medium text-gray-500">Produto mais vendido</p>
              {resumo.produtoMaisVendido ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-800">
                  {resumo.produtoMaisVendido.nome}
                  <Badge cor="primary">{resumo.produtoMaisVendido.quantidade}x vendidos</Badge>
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Sem vendas no período</p>
              )}
            </Card>
            <Card>
              <p className="text-xs font-medium text-gray-500">Cliente que mais compra</p>
              {resumo.clienteTop ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-gray-800">
                    {resumo.clienteTop.nome}
                  </p>
                  <p className="text-sm text-gray-500">
                    {resumo.clienteTop.telefone} · R$ {resumo.clienteTop.totalGasto.toFixed(2)} em{' '}
                    {resumo.clienteTop.totalPedidos}{' '}
                    {resumo.clienteTop.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Sem pedidos no período</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
