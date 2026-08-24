import { DIAS_SEMANA } from '../../lib/horario';
import { DiaHorarioFuncionamento, HorariosFuncionamento } from '../../types';

/** Segunda a domingo — ordem de exibição da semana de trabalho, diferente da ordem interna dos dados (0=domingo, igual Date.getDay()). */
const ORDEM_EXIBICAO = [1, 2, 3, 4, 5, 6, 0];

const FAIXA_PADRAO = { abertura: '08:00', fechamento: '18:00' };

function diaOuVazio(valor: HorariosFuncionamento, diaSemana: number): DiaHorarioFuncionamento {
  return valor.find((d) => d.diaSemana === diaSemana) ?? { diaSemana, ativo: false, faixas: [] };
}

interface LinhaDiaProps {
  dia: DiaHorarioFuncionamento;
  aoAlternarAtivo: () => void;
  aoAdicionarFaixa: () => void;
  aoRemoverFaixa: (indice: number) => void;
  aoEditarFaixa: (indice: number, campo: 'abertura' | 'fechamento', valor: string) => void;
  aoAplicarATodos: () => void;
}

function LinhaDia({
  dia,
  aoAlternarAtivo,
  aoAdicionarFaixa,
  aoRemoverFaixa,
  aoEditarFaixa,
  aoAplicarATodos,
}: LinhaDiaProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {DIAS_SEMANA[dia.diaSemana]}
        </p>
        <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
          <input
            type="checkbox"
            checked={dia.ativo}
            onChange={aoAlternarAtivo}
            className="h-4 w-4 accent-primary"
          />
          {dia.ativo ? 'Aberto' : 'Fechado'}
        </label>
      </div>

      {!dia.ativo ? (
        <p className="mt-1.5 text-xs text-gray-400">Loja não funciona neste dia.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {dia.faixas.map((faixa, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <input
                type="time"
                value={faixa.abertura}
                onChange={(e) => aoEditarFaixa(indice, 'abertura', e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span aria-hidden="true" className="text-gray-400">
                →
              </span>
              <input
                type="time"
                value={faixa.fechamento}
                onChange={(e) => aoEditarFaixa(indice, 'fechamento', e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => aoRemoverFaixa(indice)}
                aria-label="Remover este horário"
                className="rounded-full p-1.5 text-red-600 transition-colors hover:bg-red-50"
              >
                🗑
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={aoAdicionarFaixa}
              className="text-xs font-semibold text-primary-hover hover:underline"
            >
              + Adicionar horário
            </button>
            <button
              type="button"
              onClick={aoAplicarATodos}
              className="text-xs font-medium text-gray-500 hover:underline"
            >
              Aplicar este horário aos outros dias
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgendaHorarios({
  valor,
  aoMudar,
}: {
  valor: HorariosFuncionamento;
  aoMudar: (novo: HorariosFuncionamento) => void;
}) {
  function atualizarDia(diaSemana: number, atualizado: DiaHorarioFuncionamento) {
    const semDia = valor.filter((d) => d.diaSemana !== diaSemana);
    aoMudar([...semDia, atualizado]);
  }

  function alternarAtivo(dia: DiaHorarioFuncionamento) {
    if (dia.ativo) {
      atualizarDia(dia.diaSemana, { ...dia, ativo: false, faixas: [] });
    } else {
      atualizarDia(dia.diaSemana, { ...dia, ativo: true, faixas: [{ ...FAIXA_PADRAO }] });
    }
  }

  function adicionarFaixa(dia: DiaHorarioFuncionamento) {
    const ultima = dia.faixas[dia.faixas.length - 1];
    const novaFaixa = ultima ? { abertura: ultima.fechamento, fechamento: '23:59' } : FAIXA_PADRAO;
    atualizarDia(dia.diaSemana, { ...dia, faixas: [...dia.faixas, { ...novaFaixa }] });
  }

  function removerFaixa(dia: DiaHorarioFuncionamento, indice: number) {
    const faixas = dia.faixas.filter((_, i) => i !== indice);
    // Sem nenhuma faixa restante, o dia vira "fechado" — nunca deixa o
    // estado inconsistente de "aberto" sem horário nenhum cadastrado.
    atualizarDia(
      dia.diaSemana,
      faixas.length === 0 ? { ...dia, ativo: false, faixas: [] } : { ...dia, faixas },
    );
  }

  function editarFaixa(
    dia: DiaHorarioFuncionamento,
    indice: number,
    campo: 'abertura' | 'fechamento',
    novoValor: string,
  ) {
    const faixas = dia.faixas.map((f, i) => (i === indice ? { ...f, [campo]: novoValor } : f));
    atualizarDia(dia.diaSemana, { ...dia, faixas });
  }

  function aplicarATodos(dia: DiaHorarioFuncionamento) {
    aoMudar(
      ORDEM_EXIBICAO.map((diaSemana) =>
        diaSemana === dia.diaSemana
          ? dia
          : { diaSemana, ativo: true, faixas: dia.faixas.map((f) => ({ ...f })) },
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {ORDEM_EXIBICAO.map((diaSemana) => {
        const dia = diaOuVazio(valor, diaSemana);
        return (
          <LinhaDia
            key={diaSemana}
            dia={dia}
            aoAlternarAtivo={() => alternarAtivo(dia)}
            aoAdicionarFaixa={() => adicionarFaixa(dia)}
            aoRemoverFaixa={(indice) => removerFaixa(dia, indice)}
            aoEditarFaixa={(indice, campo, novoValor) => editarFaixa(dia, indice, campo, novoValor)}
            aoAplicarATodos={() => aplicarATodos(dia)}
          />
        );
      })}
    </div>
  );
}
