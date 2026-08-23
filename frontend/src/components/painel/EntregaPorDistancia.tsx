import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { api } from '../../lib/api';
import { validarFaixasEntrega } from '../../lib/distancia';
import { formatarValorEntrega } from '../../lib/endereco';
import { FaixaEntregaDistancia, Loja } from '../../types';

interface FaixaFormulario {
  distanciaKm: string;
  valorEntrega: string;
}

function faixasParaFormulario(faixas: FaixaEntregaDistancia[]): FaixaFormulario[] {
  if (faixas.length === 0) return [{ distanciaKm: '', valorEntrega: '' }];
  return faixas
    .slice()
    .sort((a, b) => a.distanciaMaxMetros - b.distanciaMaxMetros)
    .map((f) => ({
      distanciaKm: String(f.distanciaMaxMetros / 1000),
      valorEntrega: String(f.valorEntrega),
    }));
}

interface Props {
  loja: Loja;
  recarregarLoja: () => void;
}

export function EntregaPorDistancia({ loja, recarregarLoja }: Props) {
  const [faixas, setFaixas] = useState<FaixaFormulario[] | null>(null);
  const [salvandoToggle, setSalvandoToggle] = useState(false);
  const [salvandoFaixas, setSalvandoFaixas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    api<FaixaEntregaDistancia[]>('/api/admin/faixas-entrega', { autenticado: true }).then((resp) =>
      setFaixas(faixasParaFormulario(resp)),
    );
  }, []);

  const semLocalizacao = loja.latitude === null || loja.longitude === null;

  async function alternarRecurso(ligar: boolean) {
    setErro(null);
    setMensagem(null);
    setSalvandoToggle(true);
    try {
      await api<Loja>('/api/admin/loja', {
        method: 'PUT',
        autenticado: true,
        body: { calcularEntregaPorDistancia: ligar },
      });
      recarregarLoja();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível atualizar');
    } finally {
      setSalvandoToggle(false);
    }
  }

  function atualizarFaixa(indice: number, campo: keyof FaixaFormulario, valor: string) {
    setFaixas((atuais) =>
      (atuais ?? []).map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)),
    );
  }

  function adicionarFaixa() {
    setFaixas((atuais) => [...(atuais ?? []), { distanciaKm: '', valorEntrega: '' }]);
  }

  function removerFaixa(indice: number) {
    setFaixas((atuais) => (atuais ?? []).filter((_, i) => i !== indice));
  }

  async function salvarFaixas() {
    if (!faixas) return;
    setErro(null);
    setMensagem(null);

    const convertidas = faixas.map((f) => ({
      distanciaMaxMetros: Math.round(Number(f.distanciaKm.replace(',', '.')) * 1000),
      valorEntrega: Number(f.valorEntrega.replace(',', '.')),
    }));

    const validacao = validarFaixasEntrega(convertidas);
    if (!validacao.valido) {
      setErro(validacao.erro);
      return;
    }

    setSalvandoFaixas(true);
    try {
      const salvas = await api<FaixaEntregaDistancia[]>('/api/admin/faixas-entrega', {
        method: 'PUT',
        autenticado: true,
        body: { faixas: convertidas },
      });
      setFaixas(faixasParaFormulario(salvas));
      setMensagem('Faixas salvas com sucesso.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar as faixas');
    } finally {
      setSalvandoFaixas(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Taxa por distância</h2>
        <p className="mt-1 text-sm text-gray-500">
          Estratégia alternativa ao bairro: calcula a entrega pela distância aproximada em linha
          reta até o cliente, em faixas configuráveis (ex: até 500m grátis).
        </p>
      </div>

      {semLocalizacao && (
        <Alert tipo="info">
          Configure a localização da loja em{' '}
          <Link to="/painel/loja" className="underline">
            Minha loja
          </Link>{' '}
          antes de ativar esse recurso.
        </Alert>
      )}

      <label className="flex items-center gap-1.5 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={loja.calcularEntregaPorDistancia}
          disabled={salvandoToggle || (semLocalizacao && !loja.calcularEntregaPorDistancia)}
          onChange={(e) => alternarRecurso(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Calcular entrega pela distância
      </label>

      {loja.calcularEntregaPorDistancia && faixas && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Faixas de entrega
          </p>
          {faixas.map((faixa, indice) => (
            <div key={indice} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600">Até</span>
              <input
                type="text"
                inputMode="decimal"
                value={faixa.distanciaKm}
                onChange={(e) => atualizarFaixa(indice, 'distanciaKm', e.target.value)}
                placeholder="0,5"
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-gray-600">km →</span>
              <input
                type="text"
                inputMode="decimal"
                value={faixa.valorEntrega}
                onChange={(e) => atualizarFaixa(indice, 'valorEntrega', e.target.value)}
                placeholder="0,00 (grátis)"
                className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-gray-400">
                {faixa.valorEntrega.trim() !== '' &&
                  formatarValorEntrega(Number(faixa.valorEntrega.replace(',', '.')) || 0)}
              </span>
              <Button
                type="button"
                variante="ghost-danger"
                tamanho="sm"
                onClick={() => removerFaixa(indice)}
              >
                Remover
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variante="secondary" tamanho="sm" onClick={adicionarFaixa}>
              + Adicionar faixa
            </Button>
            <Button type="button" tamanho="sm" onClick={salvarFaixas} disabled={salvandoFaixas}>
              {salvandoFaixas ? 'Salvando...' : 'Salvar faixas'}
            </Button>
          </div>
        </div>
      )}

      {mensagem && <Alert tipo="sucesso">{mensagem}</Alert>}
      {erro && <Alert tipo="erro">{erro}</Alert>}
    </Card>
  );
}
