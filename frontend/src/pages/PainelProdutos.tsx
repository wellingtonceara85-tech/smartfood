import { useEffect, useRef, useState } from 'react';
import { api, enviarFoto } from '../lib/api';
import { Categoria, Produto } from '../types';

interface FormularioProduto {
  id?: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  preco: string;
  fotoUrl: string;
  opcoes: string;
}

const formularioVazio: FormularioProduto = {
  categoriaId: '',
  nome: '',
  descricao: '',
  preco: '',
  fotoUrl: '',
  opcoes: '',
};

export function PainelProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formulario, setFormulario] = useState<FormularioProduto | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null);
  const [nomeCategoriaEditando, setNomeCategoriaEditando] = useState('');
  const formularioRef = useRef<HTMLFormElement>(null);
  const formularioAberto = formulario !== null;

  // Dispara só quando o formulário abre/fecha (não a cada tecla digitada) — senão a
  // página ficaria rolando de novo a cada alteração de campo.
  useEffect(() => {
    if (formularioAberto) {
      formularioRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [formularioAberto]);

  async function carregar() {
    setCarregando(true);
    try {
      const [produtosResp, categoriasResp] = await Promise.all([
        api<Produto[]>('/api/admin/produtos', { autenticado: true }),
        api<Categoria[]>('/api/admin/categorias', { autenticado: true }),
      ]);
      setProdutos(produtosResp);
      setCategorias(categoriasResp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alternarDisponibilidade(produto: Produto) {
    const atualizado = await api<Produto>(`/api/admin/produtos/${produto.id}/disponibilidade`, {
      method: 'PATCH',
      autenticado: true,
      body: { disponivel: !produto.disponivel },
    });
    setProdutos((atuais) => atuais.map((p) => (p.id === atualizado.id ? atualizado : p)));
  }

  async function excluirProduto(id: string) {
    if (!confirm('Excluir este produto?')) return;
    await api(`/api/admin/produtos/${id}`, { method: 'DELETE', autenticado: true });
    setProdutos((atuais) => atuais.filter((p) => p.id !== id));
  }

  async function criarCategoria() {
    if (!novaCategoria.trim()) return;
    const categoria = await api<Categoria>('/api/admin/categorias', {
      method: 'POST',
      autenticado: true,
      body: { nome: novaCategoria.trim(), ordem: categorias.length },
    });
    setCategorias((atuais) => [...atuais, categoria]);
    setNovaCategoria('');
  }

  function iniciarEdicaoCategoria(categoria: Categoria) {
    setCategoriaEditandoId(categoria.id);
    setNomeCategoriaEditando(categoria.nome);
  }

  async function salvarEdicaoCategoria(id: string) {
    if (!nomeCategoriaEditando.trim()) return;
    const categoria = await api<Categoria>(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      autenticado: true,
      body: { nome: nomeCategoriaEditando.trim() },
    });
    setCategorias((atuais) =>
      atuais.map((c) => (c.id === id ? { ...c, nome: categoria.nome } : c)),
    );
    setCategoriaEditandoId(null);
  }

  async function excluirCategoria(id: string) {
    if (!confirm('Excluir esta categoria? Os produtos dela também serão excluídos.')) return;
    await api(`/api/admin/categorias/${id}`, { method: 'DELETE', autenticado: true });
    setCategorias((atuais) => atuais.filter((c) => c.id !== id));
    setProdutos((atuais) => atuais.filter((p) => p.categoriaId !== id));
  }

  async function salvarProduto(evento: React.FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setErro(null);

    const corpo = {
      categoriaId: formulario.categoriaId,
      nome: formulario.nome,
      descricao: formulario.descricao || null,
      preco: Number(formulario.preco.replace(',', '.')),
      fotoUrl: formulario.fotoUrl || null,
      opcoes: formulario.opcoes.trim() ? formulario.opcoes.split(',').map((o) => o.trim()) : null,
    };

    try {
      if (formulario.id) {
        const atualizado = await api<Produto>(`/api/admin/produtos/${formulario.id}`, {
          method: 'PUT',
          autenticado: true,
          body: corpo,
        });
        setProdutos((atuais) => atuais.map((p) => (p.id === atualizado.id ? atualizado : p)));
      } else {
        const criado = await api<Produto>('/api/admin/produtos', {
          method: 'POST',
          autenticado: true,
          body: corpo,
        });
        setProdutos((atuais) => [criado, ...atuais]);
      }
      setFormulario(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar produto');
    }
  }

  async function aoSelecionarFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !formulario) return;

    setEnviandoFoto(true);
    setErro(null);
    try {
      const url = await enviarFoto(arquivo);
      setFormulario({ ...formulario, fotoUrl: url });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar a foto');
    } finally {
      setEnviandoFoto(false);
      evento.target.value = '';
    }
  }

  function editar(produto: Produto) {
    setFormulario({
      id: produto.id,
      categoriaId: produto.categoriaId ?? '',
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      preco: String(produto.preco),
      fotoUrl: produto.fotoUrl ?? '',
      opcoes: produto.opcoes?.join(', ') ?? '',
    });
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 font-semibold text-gray-800">Categorias</h2>
        <div className="flex flex-wrap gap-2">
          {categorias.map((categoria) =>
            categoriaEditandoId === categoria.id ? (
              <span
                key={categoria.id}
                className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1"
              >
                <input
                  autoFocus
                  value={nomeCategoriaEditando}
                  onChange={(e) => setNomeCategoriaEditando(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(categoria.id)}
                  className="w-28 rounded border border-gray-300 px-1.5 py-0.5 text-sm"
                />
                <button
                  onClick={() => salvarEdicaoCategoria(categoria.id)}
                  className="text-xs font-medium text-green-700 hover:underline"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setCategoriaEditandoId(null)}
                  className="text-xs font-medium text-gray-500 hover:underline"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <span
                key={categoria.id}
                className="flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700"
              >
                {categoria.nome}
                <button
                  onClick={() => iniciarEdicaoCategoria(categoria)}
                  className="text-gray-500 hover:text-blue-600"
                  title="Editar categoria"
                  aria-label="Editar categoria"
                >
                  ✎
                </button>
                <button
                  onClick={() => excluirCategoria(categoria.id)}
                  className="text-gray-500 hover:text-red-600"
                  title="Excluir categoria"
                  aria-label="Excluir categoria"
                >
                  ×
                </button>
              </span>
            ),
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            placeholder="Nova categoria"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={criarCategoria}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Produtos</h2>
          <button
            onClick={() => setFormulario(formularioVazio)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Novo produto
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {produtos.map((produto) => (
            <li
              key={produto.id}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div className={`flex items-center gap-3 ${produto.disponivel ? '' : 'opacity-50'}`}>
                {produto.fotoUrl ? (
                  <img
                    src={produto.fotoUrl}
                    alt={produto.nome}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-100" />
                )}
                <div>
                  <p className="font-medium text-gray-800">{produto.nome}</p>
                  <p className="text-sm text-gray-500">R$ {produto.preco.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={produto.disponivel}
                    onChange={() => alternarDisponibilidade(produto)}
                  />
                  Disponível
                </label>
                <button
                  onClick={() => editar(produto)}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluirProduto(produto.id)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
          {produtos.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum produto cadastrado ainda.</p>
          )}
        </ul>
      </section>

      {formulario && (
        <form
          ref={formularioRef}
          onSubmit={salvarProduto}
          className="flex flex-col gap-3 rounded-lg border bg-white p-4"
        >
          <h3 className="font-semibold text-gray-800">
            {formulario.id ? 'Editar produto' : 'Novo produto'}
          </h3>

          <select
            required
            value={formulario.categoriaId}
            onChange={(e) => setFormulario({ ...formulario, categoriaId: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>

          <input
            required
            placeholder="Nome"
            value={formulario.nome}
            onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <textarea
            placeholder="Descrição"
            value={formulario.descricao}
            onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            required
            placeholder="Preço (ex: 22.90)"
            value={formulario.preco}
            onChange={(e) => setFormulario({ ...formulario, preco: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <div className="flex items-center gap-3">
            {formulario.fotoUrl && (
              <img
                src={formulario.fotoUrl}
                alt="Foto do produto"
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
            <label className="flex cursor-pointer flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Foto do produto</span>
              <input type="file" accept="image/*" onChange={aoSelecionarFoto} className="text-sm" />
              {enviandoFoto && <span className="text-xs text-gray-500">Enviando...</span>}
              <span className="text-xs text-gray-500">
                Recomendado: foto quadrada, mínimo 600x600px, produto centralizado
              </span>
            </label>
          </div>
          <input
            placeholder="Opções separadas por vírgula (ex: Ao ponto, Bem passado)"
            value={formulario.opcoes}
            onChange={(e) => setFormulario({ ...formulario, opcoes: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviandoFoto}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60"
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
