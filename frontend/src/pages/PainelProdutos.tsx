import { useEffect, useRef, useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { BarraSelecaoProdutos } from '../components/painel/BarraSelecaoProdutos';
import { CategoriasArrastaveis } from '../components/painel/CategoriasArrastaveis';
import { GruposOpcoesEditor } from '../components/painel/GruposOpcoesEditor';
import { ProdutoLinha } from '../components/painel/ProdutoLinha';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import { ApiError, api, enviarFoto } from '../lib/api';
import { corpoProdutoComGrupos, GrupoEditavel, validarGrupos } from '../lib/gruposOpcoes';
import { agruparProdutosPorCategoria } from '../lib/produto';
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
  const { logout } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioProduto | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null);
  const [nomeCategoriaEditando, setNomeCategoriaEditando] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [movendo, setMovendo] = useState(false);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [produtoDestacadoId, setProdutoDestacadoId] = useState<string | null>(null);
  const [aberturaId, setAberturaId] = useState(0);
  // Alimentado pelo próprio GruposOpcoesEditor (só ele sabe se os grupos
  // carregados têm algum ativo) — usado só pro aviso ao lado do campo legado.
  const [temGrupoAtivoNoFormulario, setTemGrupoAtivoNoFormulario] = useState(false);
  // Rascunho dos grupos configurados enquanto o produto ainda não existe
  // (formulario.id === undefined) — enviado junto no POST /produtos ao
  // salvar. Sem efeito nenhum ao editar um produto já existente (nesse caso
  // o próprio GruposOpcoesEditor salva os grupos direto, como sempre fez).
  const [gruposRascunho, setGruposRascunho] = useState<GrupoEditavel[]>([]);

  const formularioRef = useRef<HTMLFormElement>(null);
  const nomeInputRef = useRef<HTMLInputElement>(null);

  // Rola até o formulário e foca o campo Nome toda vez que ele deve abrir —
  // depende de `aberturaId` (não de "formulário aberto?") de propósito: sem
  // isso, clicar em "Editar" num produto B enquanto o produto A já estava em
  // edição não rolava a tela de novo, porque o formulário já estava aberto e
  // o efeito não disparava. rAF espera o layout assentar antes de rolar; o
  // foco vem um instante depois, com preventScroll, pra não competir com a
  // animação do teclado virtual no celular.
  useEffect(() => {
    if (!formulario) return;
    const frame = requestAnimationFrame(() => {
      formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const timeout = setTimeout(() => {
      nomeInputRef.current?.focus({ preventScroll: true });
    }, 350);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberturaId]);

  useEffect(() => {
    if (!mensagemSucesso) return;
    const timeout = setTimeout(() => setMensagemSucesso(null), 3000);
    return () => clearTimeout(timeout);
  }, [mensagemSucesso]);

  useEffect(() => {
    if (!produtoDestacadoId) return;
    const timeout = setTimeout(() => setProdutoDestacadoId(null), 2500);
    return () => clearTimeout(timeout);
  }, [produtoDestacadoId]);

  async function carregar() {
    setCarregando(true);
    setErroCarregamento(null);
    try {
      const [produtosResp, categoriasResp] = await Promise.all([
        api<Produto[]>('/api/admin/produtos', { autenticado: true }),
        api<Categoria[]>('/api/admin/categorias', { autenticado: true }),
      ]);
      setProdutos(produtosResp);
      setCategorias(categoriasResp);
    } catch (e) {
      // 401 aqui significa que `api()` já tentou renovar a sessão pelo
      // refresh token e mesmo assim falhou — repetir a mesma chamada de novo
      // ("Tentar novamente") nunca vai funcionar, porque nada sobre a sessão
      // mudou. Em vez de deixar o lojista preso num retry que nunca resolve,
      // segue o mesmo caminho que o botão "Sair" já usa pra voltar ao login.
      if ((e as ApiError)?.status === 401) {
        logout();
        return;
      }
      // Qualquer outra falha (rede, erro do servidor) pode ser passageira —
      // nunca deixa passar por "loja sem produtos": produtos/categorias
      // ficam vazios, mas o EmptyState de "Nenhum produto cadastrado" só
      // aparece de fato quando não há esse erro.
      setErroCarregamento('Não foi possível carregar seus produtos agora.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirFormulario(dados: FormularioProduto) {
    setFormulario(dados);
    setErro(null);
    setAberturaId((v) => v + 1);
    // Reseta enquanto o GruposOpcoesEditor (se houver) ainda não carregou os
    // grupos reais do produto que está abrindo — evita mostrar o aviso com
    // base no produto editado anteriormente por um instante.
    setTemGrupoAtivoNoFormulario(false);
    setGruposRascunho([]);
  }

  function editar(produto: Produto) {
    abrirFormulario({
      id: produto.id,
      categoriaId: produto.categoriaId,
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      preco: String(produto.preco),
      fotoUrl: produto.fotoUrl ?? '',
      opcoes: produto.opcoes?.join(', ') ?? '',
    });
  }

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
    setSelecionados((atuais) => {
      const copia = new Set(atuais);
      copia.delete(id);
      return copia;
    });
  }

  async function duplicarProduto(produto: Produto) {
    setDuplicandoId(produto.id);
    setErro(null);
    try {
      const copia = await api<Produto>(`/api/admin/produtos/${produto.id}/duplicar`, {
        method: 'POST',
        autenticado: true,
      });
      setProdutos((atuais) => [...atuais, copia]);
      setMensagemSucesso(`"${produto.nome}" duplicado.`);
      setProdutoDestacadoId(copia.id);
      editar(copia);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao duplicar produto');
    } finally {
      setDuplicandoId(null);
    }
  }

  function alternarSelecao(id: string) {
    setSelecionados((atuais) => {
      const copia = new Set(atuais);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  async function moverSelecionados(categoriaId: string) {
    setMovendo(true);
    setErro(null);
    try {
      const atualizados = await api<Produto[]>('/api/admin/produtos/mover', {
        method: 'POST',
        autenticado: true,
        body: { produtoIds: [...selecionados], categoriaId },
      });
      const porId = new Map(atualizados.map((p) => [p.id, p]));
      setProdutos((atuais) => atuais.map((p) => porId.get(p.id) ?? p));
      setMensagemSucesso(
        `${atualizados.length} ${atualizados.length === 1 ? 'produto movido' : 'produtos movidos'}.`,
      );
      setSelecionados(new Set());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao mover produtos');
    } finally {
      setMovendo(false);
    }
  }

  async function reordenarCategorias(novaOrdem: Categoria[]) {
    const anterior = categorias;
    setCategorias(novaOrdem);
    try {
      const atualizadas = await api<Categoria[]>('/api/admin/categorias/reordenar', {
        method: 'PUT',
        autenticado: true,
        body: { ids: novaOrdem.map((c) => c.id) },
      });
      setCategorias(atualizadas);
    } catch (e) {
      setCategorias(anterior);
      setErro(e instanceof Error ? e.message : 'Erro ao reordenar categorias');
    }
  }

  async function reordenarProdutosDaCategoria(categoriaId: string, novaOrdemIds: string[]) {
    const anterior = produtos;
    setProdutos((atuais) =>
      atuais.map((p) => {
        if (p.categoriaId !== categoriaId) return p;
        const indice = novaOrdemIds.indexOf(p.id);
        return indice === -1 ? p : { ...p, ordem: indice };
      }),
    );
    try {
      const atualizados = await api<Produto[]>('/api/admin/produtos/reordenar', {
        method: 'PUT',
        autenticado: true,
        body: { categoriaId, ids: novaOrdemIds },
      });
      const porId = new Map(atualizados.map((p) => [p.id, p]));
      setProdutos((atuais) => atuais.map((p) => porId.get(p.id) ?? p));
    } catch (e) {
      setProdutos(anterior);
      setErro(e instanceof Error ? e.message : 'Erro ao reordenar produtos');
    }
  }

  async function criarCategoria() {
    if (!novaCategoria.trim()) return;
    const categoria = await api<Categoria>('/api/admin/categorias', {
      method: 'POST',
      autenticado: true,
      body: { nome: novaCategoria.trim(), ordem: categorias.length },
    });
    setCategorias((atuais) => [...atuais, { ...categoria, produtos: [] }]);
    setNovaCategoria('');
  }

  function iniciarEdicaoCategoria(categoria: Categoria) {
    setCategoriaEditandoId(categoria.id);
    setNomeCategoriaEditando(categoria.nome);
  }

  async function salvarEdicaoCategoria(id: string) {
    if (!nomeCategoriaEditando.trim()) return;
    // Renomear só troca `nome` — o vínculo dos produtos é por categoriaId
    // (chave estrangeira), nunca pelo texto, então nenhum produto precisa
    // ser tocado aqui.
    const categoria = await api<Categoria>(`/api/admin/categorias/${id}`, {
      method: 'PUT',
      autenticado: true,
      body: { nome: nomeCategoriaEditando.trim() },
    });
    setCategorias((atuais) =>
      atuais.map((c) => (c.id === id ? { ...c, nome: categoria.nome } : c)),
    );
    setCategoriaEditandoId(null);
    setMensagemSucesso('Categoria renomeada.');
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

    // GruposOpcoesEditor mantém gruposRascunho sincronizado o tempo todo (na
    // criação E na edição — ver aoMudarGrupos) — então o botão "Salvar"
    // principal sempre manda o estado atual dos grupos junto, tanto criando
    // quanto editando. Antes, editar um produto só salvava os grupos através
    // do botão isolado "Salvar grupos de opções" do editor: se o lojista
    // mudasse um grupo e clicasse no "Salvar" principal (o caminho mais
    // óbvio), a mudança era descartada silenciosamente e reabrir o produto
    // mostrava os valores antigos — esse era o bug relatado na homologação.
    const erroValidacaoGrupos = validarGrupos(gruposRascunho);
    if (erroValidacaoGrupos) {
      setErro(erroValidacaoGrupos);
      return;
    }

    try {
      if (formulario.id) {
        const atualizado = await api<Produto>(`/api/admin/produtos/${formulario.id}`, {
          method: 'PUT',
          autenticado: true,
          body: corpoProdutoComGrupos(corpo, gruposRascunho),
        });
        setProdutos((atuais) => atuais.map((p) => (p.id === atualizado.id ? atualizado : p)));
        setMensagemSucesso('Produto atualizado.');
        setProdutoDestacadoId(atualizado.id);
      } else {
        // Produto + grupos de opções configurados durante o cadastro são
        // criados numa única chamada (o backend grava tudo numa escrita só —
        // ver POST /admin/produtos) — nunca um produto "órfão" sem os grupos
        // que o lojista acabou de montar.
        const criado = await api<Produto>('/api/admin/produtos', {
          method: 'POST',
          autenticado: true,
          body: corpoProdutoComGrupos(corpo, gruposRascunho),
        });
        setProdutos((atuais) => [...atuais, criado]);
        setMensagemSucesso(
          gruposRascunho.length > 0
            ? 'Produto criado com os grupos de opções configurados.'
            : 'Produto criado.',
        );
        setProdutoDestacadoId(criado.id);
      }
      setFormulario(null);
      setGruposRascunho([]);
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

  if (carregando) return <Loading />;

  if (erroCarregamento) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm text-red-700">{erroCarregamento}</p>
        <p className="text-xs text-red-600">
          Seus produtos continuam cadastrados — isso é só uma falha ao carregar a tela.
        </p>
        <Button variante="secondary" tamanho="sm" onClick={carregar}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const grupos = agruparProdutosPorCategoria(categorias, produtos);

  return (
    <div className="flex flex-col gap-6 pb-24">
      {mensagemSucesso && <Alert tipo="sucesso">{mensagemSucesso}</Alert>}
      {erro && !formulario && <Alert tipo="erro">{erro}</Alert>}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Categorias</h2>
        <p className="-mt-1 mb-2 text-xs text-gray-500">
          Arraste pela alça (⠿) pra reordenar — a ordem aqui é a mesma que aparece no cardápio.
        </p>

        {categorias.length > 0 && (
          <CategoriasArrastaveis
            categorias={categorias}
            aoReordenar={reordenarCategorias}
            categoriaEditandoId={categoriaEditandoId}
            nomeCategoriaEditando={nomeCategoriaEditando}
            aoIniciarEdicao={iniciarEdicaoCategoria}
            aoMudarNomeEdicao={setNomeCategoriaEditando}
            aoSalvarEdicao={salvarEdicaoCategoria}
            aoCancelarEdicao={() => setCategoriaEditandoId(null)}
            aoExcluir={excluirCategoria}
          />
        )}

        <div className="mt-2 flex gap-2">
          <Input
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            placeholder="Nova categoria"
            className="max-w-xs"
          />
          <Button variante="secondary" tamanho="sm" onClick={criarCategoria}>
            Adicionar
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Produtos</h2>
          <Button tamanho="sm" onClick={() => abrirFormulario(formularioVazio)}>
            Novo produto
          </Button>
        </div>

        {produtos.length === 0 ? (
          <EmptyState
            icone="🍔"
            titulo="Nenhum produto cadastrado"
            descricao="Cadastre o primeiro produto do seu cardápio pra começar a vender."
            acao={
              <Button tamanho="sm" onClick={() => abrirFormulario(formularioVazio)}>
                Novo produto
              </Button>
            }
          />
        ) : (
          grupos.map(({ categoria, produtos: produtosDaCategoria }) =>
            produtosDaCategoria.length > 0 ? (
              <GrupoProdutosCategoria
                key={categoria.id}
                categoria={categoria}
                produtos={produtosDaCategoria}
                selecionados={selecionados}
                produtoDestacadoId={produtoDestacadoId}
                duplicandoId={duplicandoId}
                aoAlternarSelecao={alternarSelecao}
                aoAlternarDisponibilidade={alternarDisponibilidade}
                aoEditar={editar}
                aoDuplicar={duplicarProduto}
                aoExcluir={excluirProduto}
                aoReordenar={(ids) => reordenarProdutosDaCategoria(categoria.id, ids)}
              />
            ) : (
              <div key={categoria.id}>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {categoria.nome}
                </p>
                <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-400">
                  Nenhum produto nesta categoria ainda.
                </p>
              </div>
            ),
          )
        )}
      </section>

      {formulario && (
        <form ref={formularioRef} onSubmit={salvarProduto}>
          <Card className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800">
              {formulario.id ? 'Editar produto' : 'Novo produto'}
            </h3>

            <Select
              required
              value={formulario.categoriaId}
              onChange={(e) => setFormulario({ ...formulario, categoriaId: e.target.value })}
            >
              <option value="">Selecione a categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </Select>

            <Input
              ref={nomeInputRef}
              required
              placeholder="Nome"
              value={formulario.nome}
              onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            />
            <Textarea
              placeholder="Descrição"
              value={formulario.descricao}
              onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
            />
            <p className="-mt-2 text-xs text-gray-500">
              Ex: Acompanha arroz, feijão, macarrão, farofa e salada crua.
            </p>
            <Input
              required
              placeholder="Preço (ex: 22.90)"
              value={formulario.preco}
              onChange={(e) => setFormulario({ ...formulario, preco: e.target.value })}
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={aoSelecionarFoto}
                  className="text-sm"
                />
                {enviandoFoto && <span className="text-xs text-gray-500">Enviando...</span>}
                <span className="text-xs text-gray-500">Produtos com foto vendem mais.</span>
                <span className="text-xs text-gray-500">
                  Recomendado: foto quadrada, mínimo 600x600px, produto centralizado
                </span>
              </label>
            </div>
            <Input
              placeholder="Opções separadas por vírgula (ex: Ao ponto, Bem passado)"
              value={formulario.opcoes}
              onChange={(e) => setFormulario({ ...formulario, opcoes: e.target.value })}
            />
            <p className="-mt-2 text-xs text-gray-500">
              Modelo simples e antigo de opções — uma lista com escolha única, sem preço adicional.
              Continua funcionando normalmente; pra opções com preço adicional, mínimo obrigatório
              ou múltipla escolha, use "Grupos de opções" abaixo.
            </p>
            {temGrupoAtivoNoFormulario && (
              <p className="-mt-2 text-xs font-medium text-amber-600">
                Este produto tem Grupos de Opções ativos — por isso, essas opções simples não
                aparecem no cardápio público agora. Elas voltam a aparecer automaticamente se você
                desativar todos os grupos abaixo.
              </p>
            )}

            <div className="border-t border-gray-100 pt-3">
              {/* Disponível desde a criação (produtoId null até o produto ser
                  salvo) — o lojista já vê sugestões por nicho e monta os
                  grupos antes mesmo de existir um produto pra salvar neles;
                  tudo vai junto no primeiro "Salvar". Nenhuma mudança pro
                  fluxo de edição de um produto já existente. */}
              <GruposOpcoesEditor
                key={formulario.id ?? `novo-${aberturaId}`}
                produtoId={formulario.id ?? null}
                outrosProdutos={produtos
                  .filter((p) => p.id !== formulario.id)
                  .map((p) => ({ id: p.id, nome: p.nome }))}
                aoMudarTemGrupoAtivo={setTemGrupoAtivoNoFormulario}
                aoMudarGrupos={setGruposRascunho}
              />
            </div>

            {erro && <Alert tipo="erro">{erro}</Alert>}

            <div className="flex gap-2">
              <Button type="submit" disabled={enviandoFoto}>
                Salvar
              </Button>
              <Button
                type="button"
                variante="secondary"
                onClick={() => {
                  setFormulario(null);
                  setErro(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </form>
      )}

      <BarraSelecaoProdutos
        quantidade={selecionados.size}
        categorias={categorias}
        movendo={movendo}
        aoMover={moverSelecionados}
        aoCancelar={() => setSelecionados(new Set())}
      />
    </div>
  );
}

interface GrupoProps {
  categoria: Categoria;
  produtos: Produto[];
  selecionados: Set<string>;
  produtoDestacadoId: string | null;
  duplicandoId: string | null;
  aoAlternarSelecao: (id: string) => void;
  aoAlternarDisponibilidade: (produto: Produto) => void;
  aoEditar: (produto: Produto) => void;
  aoDuplicar: (produto: Produto) => void;
  aoExcluir: (id: string) => void;
  aoReordenar: (novaOrdemIds: string[]) => void;
}

/** Uma seção por categoria — o arrasto de produtos fica sempre restrito à própria categoria (mover pra outra é a ação "Mover em massa", não drag). */
function GrupoProdutosCategoria({
  categoria,
  produtos,
  selecionados,
  produtoDestacadoId,
  duplicandoId,
  aoAlternarSelecao,
  aoAlternarDisponibilidade,
  aoEditar,
  aoDuplicar,
  aoExcluir,
  aoReordenar,
}: GrupoProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function aoFinalizarArrasto(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;
    const indiceAntigo = produtos.findIndex((p) => p.id === active.id);
    const indiceNovo = produtos.findIndex((p) => p.id === over.id);
    if (indiceAntigo === -1 || indiceNovo === -1) return;
    aoReordenar(arrayMove(produtos, indiceAntigo, indiceNovo).map((p) => p.id));
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {categoria.nome}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={aoFinalizarArrasto}
      >
        <SortableContext items={produtos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {produtos.map((produto) => (
              <ProdutoLinha
                key={produto.id}
                produto={produto}
                selecionado={selecionados.has(produto.id)}
                destacado={produtoDestacadoId === produto.id}
                duplicando={duplicandoId === produto.id}
                aoAlternarSelecao={() => aoAlternarSelecao(produto.id)}
                aoAlternarDisponibilidade={() => aoAlternarDisponibilidade(produto)}
                aoEditar={() => aoEditar(produto)}
                aoDuplicar={() => aoDuplicar(produto)}
                aoExcluir={() => aoExcluir(produto.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
