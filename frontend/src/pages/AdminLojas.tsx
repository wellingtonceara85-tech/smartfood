import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { slugificar } from '../lib/slug';
import { useAuth } from '../context/AuthContext';
import { LojaAdmin } from '../types';

interface FormularioLoja {
  nome: string;
  slug: string;
  slugEditadoManualmente: boolean;
  telefoneWhatsapp: string;
  donoNome: string;
  donoEmail: string;
}

const formularioVazio: FormularioLoja = {
  nome: '',
  slug: '',
  slugEditadoManualmente: false,
  telefoneWhatsapp: '',
  donoNome: '',
  donoEmail: '',
};

interface LojaCriada extends LojaAdmin {
  linkAtivacao: string;
}

interface LinkGerado {
  lojaNome: string;
  link: string;
}

export function AdminLojas() {
  const { usuario, logout } = useAuth();
  const [lojas, setLojas] = useState<LojaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formulario, setFormulario] = useState<FormularioLoja | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [linkGerado, setLinkGerado] = useState<LinkGerado | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [gerandoConviteId, setGerandoConviteId] = useState<string | null>(null);
  const formularioRef = useRef<HTMLFormElement>(null);
  const linkGeradoRef = useRef<HTMLDivElement>(null);
  const formularioAberto = formulario !== null;

  useEffect(() => {
    if (formularioAberto) {
      formularioRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [formularioAberto]);

  useEffect(() => {
    if (linkGerado) {
      linkGeradoRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [linkGerado]);

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
      const criada = await api<LojaCriada>('/api/admin-master/lojas', {
        method: 'POST',
        autenticado: true,
        body: {
          nome: formulario.nome,
          slug: formulario.slug,
          telefoneWhatsapp: formulario.telefoneWhatsapp,
          donoNome: formulario.donoNome,
          donoEmail: formulario.donoEmail,
        },
      });
      const { linkAtivacao, ...lojaResumo } = criada;
      setLojas((atuais) => [lojaResumo, ...atuais]);
      setFormulario(null);
      setLinkGerado({ lojaNome: criada.nome, link: linkAtivacao });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar loja');
    } finally {
      setSalvando(false);
    }
  }

  async function reenviarConvite(loja: LojaAdmin) {
    setGerandoConviteId(loja.id);
    try {
      const resp = await api<{ linkAtivacao: string }>(
        `/api/admin-master/lojas/${loja.id}/convite`,
        { method: 'POST', autenticado: true },
      );
      setLinkGerado({ lojaNome: loja.nome, link: resp.linkAtivacao });
    } finally {
      setGerandoConviteId(null);
    }
  }

  async function copiarLink() {
    if (!linkGerado) return;
    try {
      await navigator.clipboard.writeText(linkGerado.link);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // clipboard indisponível — o link já fica visível e selecionável pro admin copiar manualmente
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
        {linkGerado && (
          <div
            ref={linkGeradoRef}
            className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4"
          >
            <p className="font-medium text-green-800">Link de ativação de {linkGerado.lojaNome}</p>
            <p className="mt-1 text-sm text-green-700">
              Envie esse link ao lojista pelo WhatsApp. Ele expira em 7 dias e só pode ser usado uma
              vez.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={linkGerado.link}
                onFocus={(e) => e.target.select()}
                className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-gray-700"
              />
              <button
                type="button"
                onClick={copiarLink}
                className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {linkCopiado ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLinkGerado(null)}
              className="mt-2 text-xs text-green-700 hover:underline"
            >
              Fechar
            </button>
          </div>
        )}

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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{loja.nome}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          loja.donoAtivado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {loja.donoAtivado ? 'Ativo' : 'Aguardando ativação'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      /{loja.slug} · {loja.telefoneWhatsapp}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{loja.totalProdutos} produtos</p>
                    <p>{loja.totalPedidos} pedidos</p>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <a
                    href={`/${loja.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver cardápio público →
                  </a>
                  <button
                    type="button"
                    onClick={() => reenviarConvite(loja)}
                    disabled={gerandoConviteId === loja.id}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {gerandoConviteId === loja.id
                      ? 'Gerando...'
                      : loja.donoAtivado
                        ? 'Gerar novo link de ativação'
                        : 'Reenviar link de ativação'}
                  </button>
                </div>
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
            <p className="text-sm font-medium text-gray-700">Dados do dono da loja</p>
            <p className="-mt-2 text-xs text-gray-500">
              O dono define a própria senha depois, por um link de ativação — você nunca a vê nem a
              define aqui.
            </p>

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
