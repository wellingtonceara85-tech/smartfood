import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BairroEntrega } from '../types';

interface FormularioBairro {
  id?: string;
  nomeBairro: string;
  valorEntrega: string;
}

const formularioVazio: FormularioBairro = { nomeBairro: '', valorEntrega: '' };

export function PainelBairros() {
  const [bairros, setBairros] = useState<BairroEntrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formulario, setFormulario] = useState<FormularioBairro | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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

  if (carregando) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Bairros de entrega</h2>
          <button
            onClick={() => setFormulario(formularioVazio)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Novo bairro
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {bairros.map((bairro) => (
            <li
              key={bairro.id}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div className={bairro.ativo ? '' : 'opacity-50'}>
                <p className="font-medium text-gray-800">{bairro.nomeBairro}</p>
                <p className="text-sm text-gray-500">R$ {bairro.valorEntrega.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={bairro.ativo}
                    onChange={() => alternarAtivo(bairro)}
                  />
                  Ativo
                </label>
                <button
                  onClick={() => editar(bairro)}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluir(bairro.id)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
          {bairros.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum bairro cadastrado ainda.</p>
          )}
        </ul>
      </section>

      {formulario && (
        <form
          onSubmit={salvar}
          className="flex max-w-sm flex-col gap-3 rounded-lg border bg-white p-4"
        >
          <h3 className="font-semibold text-gray-800">
            {formulario.id ? 'Editar bairro' : 'Novo bairro'}
          </h3>

          <input
            required
            placeholder="Nome do bairro"
            value={formulario.nomeBairro}
            onChange={(e) => setFormulario({ ...formulario, nomeBairro: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            required
            placeholder="Valor da entrega (ex: 8.00)"
            value={formulario.valorEntrega}
            onChange={(e) => setFormulario({ ...formulario, valorEntrega: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setFormulario(null)}
              className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
