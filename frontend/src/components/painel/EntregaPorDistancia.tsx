import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { formatarValorEntrega } from '../../lib/endereco';
import { FaixaEntregaDistancia, Loja } from '../../types';

interface FormularioFaixa {
  id?: string;
  distanciaKm: string;
  valorEntrega: string;
}

const formularioVazio: FormularioFaixa = { distanciaKm: '', valorEntrega: '' };

function formatarDistanciaFaixa(metros: number): string {
  return metros % 1000 === 0 ? `${metros / 1000} km` : `${(metros / 1000).toString()} km`;
}

interface Props {
  loja: Loja;
  recarregarLoja: () => void;
}

export function EntregaPorDistancia({ loja, recarregarLoja }: Props) {
  const [faixas, setFaixas] = useState<FaixaEntregaDistancia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoToggle, setSalvandoToggle] = useState(false);
  const [formulario, setFormulario] = useState<FormularioFaixa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroToggle, setErroToggle] = useState<string | null>(null);
  const formularioRef = useRef<HTMLFormElement>(null);
  const formularioAberto = formulario !== null;

  useEffect(() => {
    if (formularioAberto) {
      formularioRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [formularioAberto]);

  async function carregar() {
    setCarregando(true);
    try {
      const resp = await api<FaixaEntregaDistancia[]>('/api/admin/faixas-entrega', {
        autenticado: true,
      });
      setFaixas(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const semLocalizacao = loja.latitude === null || loja.longitude === null;

  async function alternarRecurso(ligar: boolean) {
    setErroToggle(null);
    setSalvandoToggle(true);
    try {
      await api<Loja>('/api/admin/loja', {
        method: 'PUT',
        autenticado: true,
        body: { calcularEntregaPorDistancia: ligar },
      });
      recarregarLoja();
    } catch (e) {
      setErroToggle(e instanceof Error ? e.message : 'Não foi possível atualizar');
    } finally {
      setSalvandoToggle(false);
    }
  }

  async function alternarAtivo(faixa: FaixaEntregaDistancia) {
    try {
      const atualizada = await api<FaixaEntregaDistancia>(`/api/admin/faixas-entrega/${faixa.id}`, {
        method: 'PUT',
        autenticado: true,
        body: { ativo: !faixa.ativo },
      });
      setFaixas((atuais) => atuais.map((f) => (f.id === atualizada.id ? atualizada : f)));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível atualizar a faixa');
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta faixa de entrega?')) return;
    await api(`/api/admin/faixas-entrega/${id}`, { method: 'DELETE', autenticado: true });
    setFaixas((atuais) => atuais.filter((f) => f.id !== id));
  }

  function editar(faixa: FaixaEntregaDistancia) {
    setFormulario({
      id: faixa.id,
      distanciaKm: String(faixa.distanciaMaxMetros / 1000),
      valorEntrega: String(faixa.valorEntrega),
    });
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setErro(null);

    const corpo = {
      distanciaMaxMetros: Math.round(Number(formulario.distanciaKm.replace(',', '.')) * 1000),
      valorEntrega: Number(formulario.valorEntrega.replace(',', '.')),
    };

    try {
      if (formulario.id) {
        const atualizada = await api<FaixaEntregaDistancia>(
          `/api/admin/faixas-entrega/${formulario.id}`,
          { method: 'PUT', autenticado: true, body: corpo },
        );
        setFaixas((atuais) => atuais.map((f) => (f.id === atualizada.id ? atualizada : f)));
      } else {
        const criada = await api<FaixaEntregaDistancia>('/api/admin/faixas-entrega', {
          method: 'POST',
          autenticado: true,
          body: corpo,
        });
        setFaixas((atuais) => [...atuais, criada]);
      }
      setFormulario(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar faixa');
    }
  }

  const faixasOrdenadas = [...faixas].sort((a, b) => a.distanciaMaxMetros - b.distanciaMaxMetros);

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Entrega por distância</h2>
        <p className="mt-1 text-sm text-gray-500">
          Defina quanto cobrar de acordo com a distância entre sua loja e o cliente. Você pode criar
          diferentes faixas e valores, inclusive entrega grátis. As faixas configuradas aqui valem
          só para esta loja — estratégia alternativa à entrega por bairro (abaixo).
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
      {erroToggle && <Alert tipo="erro">{erroToggle}</Alert>}

      {loja.calcularEntregaPorDistancia && !carregando && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Faixas de entrega
            </p>
            <Button
              type="button"
              tamanho="sm"
              variante="secondary"
              onClick={() => setFormulario(formularioVazio)}
            >
              Nova faixa
            </Button>
          </div>

          {faixasOrdenadas.length === 0 ? (
            <EmptyState
              icone="🛵"
              titulo="Nenhuma faixa cadastrada"
              descricao="Cadastre as faixas de distância que sua loja atende e o valor da taxa de cada uma (pode ser grátis)."
              acao={
                <Button tamanho="sm" onClick={() => setFormulario(formularioVazio)}>
                  Nova faixa
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {faixasOrdenadas.map((faixa) => (
                <li key={faixa.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-3 transition-shadow hover:shadow-card-hover">
                    <div className={`flex items-center gap-2 ${faixa.ativo ? '' : 'opacity-50'}`}>
                      <div>
                        <p className="font-medium text-gray-800">
                          Até {formatarDistanciaFaixa(faixa.distanciaMaxMetros)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatarValorEntrega(faixa.valorEntrega)}
                        </p>
                      </div>
                      <Badge cor={faixa.ativo ? 'primary' : 'gray'}>
                        {faixa.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={faixa.ativo}
                          onChange={() => alternarAtivo(faixa)}
                          className="h-4 w-4 accent-primary"
                        />
                        Ativa
                      </label>
                      <Button variante="ghost" tamanho="sm" onClick={() => editar(faixa)}>
                        Editar
                      </Button>
                      <Button
                        variante="ghost-danger"
                        tamanho="sm"
                        onClick={() => excluir(faixa.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {formulario && (
            <form ref={formularioRef} onSubmit={salvar} className="max-w-sm">
              <Card className="flex flex-col gap-3">
                <h3 className="font-semibold text-gray-800">
                  {formulario.id ? 'Editar faixa' : 'Nova faixa'}
                </h3>

                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-gray-600">Até</span>
                  <Input
                    required
                    inputMode="decimal"
                    placeholder="Distância em km, ex: 1"
                    value={formulario.distanciaKm}
                    onChange={(e) => setFormulario({ ...formulario, distanciaKm: e.target.value })}
                  />
                  <span className="shrink-0 text-sm text-gray-600">km →</span>
                </div>
                <Input
                  required
                  inputMode="decimal"
                  placeholder="Valor da entrega (0 = grátis)"
                  value={formulario.valorEntrega}
                  onChange={(e) => setFormulario({ ...formulario, valorEntrega: e.target.value })}
                />

                {erro && <Alert tipo="erro">{erro}</Alert>}

                <div className="flex gap-2">
                  <Button type="submit">Salvar</Button>
                  <Button type="button" variante="secondary" onClick={() => setFormulario(null)}>
                    Cancelar
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
