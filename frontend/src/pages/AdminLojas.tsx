import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LojaAdmin } from '../types';

interface FormularioLoja {
  nome: string;
  slug: string;
  slugEditadoManualmente: boolean;
  telefoneWhatsapp: string;
  donoNome: string;
  donoEmail: string;
  donoSenha: string;
}

const formularioVazio: FormularioLoja = {
  nome: '',
  slug: '',
  slugEditadoManualmente: false,
  telefoneWhatsapp: '',
  donoNome: '',
  donoEmail: '',
  donoSenha: '',
};

// eslint-disable-next-line no-misleading-character-class
const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminLojas() {
  const { usuario, logout } = useAuth();
  const [lojas, setLojas] = useState<LojaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formulario, setFormulario] = useState<FormularioLoja | null>(null);
  const [salvando, setSalvando] = useState(false);
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
      const resp = await api<LojaAdmin[]>('/api/admin-master/lojas', { autenticado: true });
      setLojas(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setErro(null);
    setSalvando(true);
    try {
      const criada = await api<LojaAdmin>('/api/admin-master/lojas', {
        method: 'POST',
        autenticado: true,
        body: {
          nome: formulario.nome,
          slug: formulario.slug,
          telefoneWhatsapp: formulario.telefoneWhatsapp,
          donoNome: formulario.donoNome,
          donoEmail: formulario.donoEmail,
          donoSenha: formulario.donoSenha,
        },
      });
      setLojas((atuais) => [criada, ...atuais]);
      setFormulario(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar loja');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <p className="font-bold text-gray-800">Administração — SmartFood</p>
          <p className="text-xs text-gray-500">{usuario?.email}</p>
        </div>
        <button onClick={logout} className="text-sm font-medium text-red-600 hover:underline">
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Lojas cadastradas</h2>
          <button
            onClick={() => setFormulario(formularioVazio)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Nova loja
          </button>
        </div>

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lojas.map((loja) => (
              <li key={loja.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{loja.nome}</p>
                    <p className="text-sm text-gray-500">
                      /{loja.slug} · {loja.telefoneWhatsapp}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{loja.totalProdutos} produtos</p>
                    <p>{loja.totalPedidos} pedidos</p>
                  </div>
                </div>
                <a
                  href={`/${loja.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                >
                  Ver cardápio público →
                </a>
              </li>
            ))}
            {lojas.length === 0 && (
              <p className="text-sm text-gray-500">Nenhuma loja cadastrada ainda.</p>
            )}
          </ul>
        )}

        {formulario && (
          <form
            ref={formularioRef}
            onSubmit={salvar}
            className="mt-6 flex flex-col gap-3 rounded-lg border bg-white p-4"
          >
            <h3 className="font-semibold text-gray-800">Nova loja</h3>

            <input
              required
              placeholder="Nome da loja"
              value={formulario.nome}
              onChange={(e) => {
                const nome = e.target.value;
                setFormulario((atual) =>
                  atual
                    ? {
                        ...atual,
                        nome,
                        slug: atual.slugEditadoManualmente ? atual.slug : slugificar(nome),
                      }
                    : atual,
                );
              }}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            <div>
              <label className="text-sm text-gray-600">Link do cardápio: /</label>
              <input
                required
                placeholder="link-da-loja"
                value={formulario.slug}
                onChange={(e) =>
                  setFormulario((atual) =>
                    atual
                      ? { ...atual, slug: slugificar(e.target.value), slugEditadoManualmente: true }
                      : atual,
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <input
              required
              placeholder="Telefone WhatsApp (com DDI+DDD, só números)"
              value={formulario.telefoneWhatsapp}
              onChange={(e) =>
                setFormulario((atual) =>
                  atual ? { ...atual, telefoneWhatsapp: e.target.value } : atual,
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            <hr />
            <p className="text-sm font-medium text-gray-700">Login do dono da loja</p>

            <input
              required
              placeholder="Nome do dono"
              value={formulario.donoNome}
              onChange={(e) =>
                setFormulario((atual) => (atual ? { ...atual, donoNome: e.target.value } : atual))
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              required
              type="email"
              placeholder="E-mail"
              value={formulario.donoEmail}
              onChange={(e) =>
                setFormulario((atual) => (atual ? { ...atual, donoEmail: e.target.value } : atual))
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              required
              placeholder="Senha (mínimo 6 caracteres)"
              value={formulario.donoSenha}
              onChange={(e) =>
                setFormulario((atual) => (atual ? { ...atual, donoSenha: e.target.value } : atual))
              }
              className="rounded-lg border border-gray-300 px-3 py-2"
            />

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {salvando ? 'Criando...' : 'Criar loja'}
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
      </main>
    </div>
  );
}
