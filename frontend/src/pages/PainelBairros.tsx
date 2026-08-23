import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { EntregaPorDistancia } from '../components/painel/EntregaPorDistancia';
import { api } from '../lib/api';
import { BairroEntrega } from '../types';
import { PainelLayoutContexto } from './PainelLayout';

interface FormularioBairro {
  id?: string;
  nomeBairro: string;
  valorEntrega: string;
}

const formularioVazio: FormularioBairro = { nomeBairro: '', valorEntrega: '' };

export function PainelBairros() {
  const { loja, recarregarLoja } = useOutletContext<PainelLayoutContexto>();
  const [bairros, setBairros] = useState<BairroEntrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formulario, setFormulario] = useState<FormularioBairro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
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
      const resp = await api<BairroEntrega[]>('/api/admin/bairros', { autenticado: true });
      setBairros(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alternarAtivo(bairro: BairroEntrega) {
    const atualizado = await api<BairroEntrega>(`/api/admin/bairros/${bairro.id}`, {
      method: 'PUT',
      autenticado: true,
      body: { ativo: !bairro.ativo },
    });
    setBairros((atuais) => atuais.map((b) => (b.id === atualizado.id ? atualizado : b)));
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este bairro?')) return;
    await api(`/api/admin/bairros/${id}`, { method: 'DELETE', autenticado: true });
    setBairros((atuais) => atuais.filter((b) => b.id !== id));
  }

  function editar(bairro: BairroEntrega) {
    setFormulario({
      id: bairro.id,
      nomeBairro: bairro.nomeBairro,
      valorEntrega: String(bairro.valorEntrega),
    });
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setErro(null);

    const corpo = {
      nomeBairro: formulario.nomeBairro,
      valorEntrega: Number(formulario.valorEntrega.replace(',', '.')),
    };

    try {
      if (formulario.id) {
        const atualizado = await api<BairroEntrega>(`/api/admin/bairros/${formulario.id}`, {
          method: 'PUT',
          autenticado: true,
          body: corpo,
        });
        setBairros((atuais) => atuais.map((b) => (b.id === atualizado.id ? atualizado : b)));
      } else {
        const criado = await api<BairroEntrega>('/api/admin/bairros', {
          method: 'POST',
          autenticado: true,
          body: corpo,
        });
        setBairros((atuais) => [...atuais, criado]);
      }
      setFormulario(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar bairro');
    }
  }

  if (carregando) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      {loja && <EntregaPorDistancia loja={loja} recarregarLoja={recarregarLoja} />}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Bairros de entrega</h2>
          <Button tamanho="sm" onClick={() => setFormulario(formularioVazio)}>
            Novo bairro
          </Button>
        </div>

        {bairros.length === 0 ? (
          <EmptyState
            icone="🛵"
            titulo="Nenhum bairro cadastrado"
            descricao="Cadastre os bairros que sua loja atende e o valor da taxa de entrega de cada um."
            acao={
              <Button tamanho="sm" onClick={() => setFormulario(formularioVazio)}>
                Novo bairro
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {bairros.map((bairro) => (
              <li key={bairro.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-3 transition-shadow hover:shadow-card-hover">
                  <div className={`flex items-center gap-2 ${bairro.ativo ? '' : 'opacity-50'}`}>
                    <div>
                      <p className="font-medium text-gray-800">{bairro.nomeBairro}</p>
                      <p className="text-sm text-gray-500">R$ {bairro.valorEntrega.toFixed(2)}</p>
                    </div>
                    <Badge cor={bairro.ativo ? 'primary' : 'gray'}>
                      {bairro.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={bairro.ativo}
                        onChange={() => alternarAtivo(bairro)}
                        className="h-4 w-4 accent-primary"
                      />
                      Ativo
                    </label>
                    <Button variante="ghost" tamanho="sm" onClick={() => editar(bairro)}>
                      Editar
                    </Button>
                    <Button variante="ghost-danger" tamanho="sm" onClick={() => excluir(bairro.id)}>
                      Excluir
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formulario && (
        <form ref={formularioRef} onSubmit={salvar} className="max-w-sm">
          <Card className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800">
              {formulario.id ? 'Editar bairro' : 'Novo bairro'}
            </h3>

            <Input
              required
              placeholder="Nome do bairro"
              value={formulario.nomeBairro}
              onChange={(e) => setFormulario({ ...formulario, nomeBairro: e.target.value })}
            />
            <Input
              required
              placeholder="Valor da entrega (ex: 8.00)"
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
  );
}
