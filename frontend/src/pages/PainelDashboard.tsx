import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DashboardResumo } from '../types';

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

export function PainelDashboard() {
  const [dataInicio, setDataInicio] = useState(hojeISO());
  const [dataFim, setDataFim] = useState(hojeISO());
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    api<DashboardResumo>(`/api/admin/dashboard?inicio=${dataInicio}&fim=${dataFim}`, {
      autenticado: true,
    })
      .then(setResumo)
      .finally(() => setCarregando(false));
  }, [dataInicio, dataFim]);

  function aplicarPeriodo(inicio: string, fim: string) {
    setDataInicio(inicio);
    setDataFim(fim);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-gray-800">Dashboard</h2>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => aplicarPeriodo(hojeISO(), hojeISO())}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodo(diasAtrasISO(6), hojeISO())}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            7 dias
          </button>
          <button
            type="button"
            onClick={() => aplicarPeriodo(inicioDoMesISO(), hojeISO())}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Este mês
          </button>
        </div>
      </div>

      {carregando && <p className="text-gray-500">Carregando...</p>}

      {!carregando && resumo && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs font-medium text-gray-500">Faturamento</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                R$ {resumo.faturamentoTotal.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs font-medium text-gray-500">Pedidos</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{resumo.totalPedidos}</p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs font-medium text-gray-500">Ticket médio</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                R$ {resumo.ticketMedio.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs font-medium text-gray-500">Produto mais vendido</p>
              {resumo.produtoMaisVendido ? (
                <p className="mt-1 text-lg font-semibold text-gray-800">
                  {resumo.produtoMaisVendido.nome}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({resumo.produtoMaisVendido.quantidade}x vendidos)
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Sem vendas no período</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-4">
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
