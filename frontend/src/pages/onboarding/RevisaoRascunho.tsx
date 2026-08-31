import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';
import { Select } from '../../components/ui/Select';
import { ApiError, api } from '../../lib/api';
import { RascunhoCardapio, RascunhoProduto } from '../../types';

interface Props {
  aoFinalizarRevisao: () => void;
  // Sem isso, um lojista que importou algo por engano (ou não quer corrigir
  // os itens pendentes) ficava sem saída dessa tela — o rascunho continuava
  // "em aberto" pra sempre, já que só dava pra avançar excluindo item por
  // item até zerar as pendências. Descartar manda de volta pra escolha do
  // método, sem apagar nenhum produto já publicado.
  aoDescartar: () => void;
}

interface FormularioEdicao {
  nome: string;
  descricao: string;
  preco: string;
  rascunhoCategoriaId: string;
  disponivel: boolean;
}

function paraFormulario(produto: RascunhoProduto): FormularioEdicao {
  return {
    nome: produto.nome ?? '',
    descricao: produto.descricao ?? '',
    preco: produto.preco !== null ? String(produto.preco) : '',
    rascunhoCategoriaId: produto.rascunhoCategoriaId ?? '',
    disponivel: produto.disponivel,
  };
}

export function RevisaoRascunho({ aoFinalizarRevisao, aoDescartar }: Props) {
  const [rascunho, setRascunho] = useState<RascunhoCardapio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioEdicao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [resultadoPublicacao, setResultadoPublicacao] = useState<string | null>(null);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [descartando, setDescartando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await api<RascunhoCardapio | null>('/api/admin/rascunho-cardapio', {
        autenticado: true,
      });
      setRascunho(dados);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function iniciarEdicao(produto: RascunhoProduto) {
    setEditandoId(produto.id);
    setFormulario(paraFormulario(produto));
    setErro(null);
  }

  async function salvarEdicao(id: string) {
    if (!formulario) return;
    setErro(null);
    try {
      await api(`/api/admin/rascunho-cardapio/produtos/${id}`, {
        method: 'PUT',
        autenticado: true,
        body: {
          nome: formulario.nome.trim() || null,
          descricao: formulario.descricao.trim() || null,
          preco: formulario.preco.trim() ? Number(formulario.preco.replace(',', '.')) : null,
          rascunhoCategoriaId: formulario.rascunhoCategoriaId || null,
          disponivel: formulario.disponivel,
        },
      });
      setEditandoId(null);
      setFormulario(null);
      await carregar();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao salvar');
    }
  }

  async function excluir(id: string) {
    await api(`/api/admin/rascunho-cardapio/produtos/${id}`, {
      method: 'DELETE',
      autenticado: true,
    });
    await carregar();
  }

  async function publicar() {
    setPublicando(true);
    setErro(null);
    try {
      const resultado = await api<{
        publicados: number;
        pendentes: number;
        rascunhoFinalizado: boolean;
      }>('/api/admin/rascunho-cardapio/publicar', { method: 'POST', autenticado: true });
      setResultadoPublicacao(
        `${resultado.publicados} ${resultado.publicados === 1 ? 'produto publicado' : 'produtos publicados'}${
          resultado.pendentes > 0 ? `, ${resultado.pendentes} ainda precisam de revisão` : ''
        }.`,
      );
      if (resultado.rascunhoFinalizado) {
        aoFinalizarRevisao();
      } else {
        await carregar();
      }
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao publicar');
    } finally {
      setPublicando(false);
    }
  }

  async function descartar() {
    setDescartando(true);
    setErro(null);
    try {
      await api('/api/admin/rascunho-cardapio/descartar', { method: 'POST', autenticado: true });
      aoDescartar();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao descartar o rascunho');
      setConfirmandoDescarte(false);
    } finally {
      setDescartando(false);
    }
  }

  if (carregando) return <Loading />;
  if (!rascunho) {
    return (
      <Alert tipo="erro">
        Nenhum rascunho encontrado — volte e importe seu cardápio novamente.
      </Alert>
    );
  }

  const { resumo } = rascunho;
  const pendentes = rascunho.produtos.filter((p) => !p.publicado);

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-secondary-light">
        <p className="text-sm font-semibold text-gray-800">Encontramos:</p>
        <ul className="mt-1 flex flex-col gap-0.5 text-sm text-gray-700">
          <li>
            {resumo.totalProdutos} {resumo.totalProdutos === 1 ? 'produto' : 'produtos'} em{' '}
            {resumo.totalCategorias} {resumo.totalCategorias === 1 ? 'categoria' : 'categorias'}
          </li>
          {resumo.duplicados > 0 && <li>{resumo.duplicados} possíveis duplicados</li>}
          {resumo.semDescricao > 0 && <li>{resumo.semDescricao} sem descrição</li>}
          {resumo.semFoto > 0 && <li>{resumo.semFoto} sem foto</li>}
          {resumo.precisaRevisao > 0 && (
            <li className="font-medium text-amber-700">
              {resumo.precisaRevisao}{' '}
              {resumo.precisaRevisao === 1 ? 'item precisa' : 'itens precisam'} de revisão antes de
              publicar
            </li>
          )}
        </ul>
      </Card>

      <div className="flex flex-col gap-2">
        {pendentes.map((produto) => (
          <Card key={produto.id} className="flex flex-col gap-2">
            {editandoId === produto.id && formulario ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={formulario.nome}
                  onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                  placeholder="Nome do produto"
                />
                <Input
                  value={formulario.preco}
                  onChange={(e) => setFormulario({ ...formulario, preco: e.target.value })}
                  placeholder="Preço (ex: 8,00)"
                />
                <Input
                  value={formulario.descricao}
                  onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
                  placeholder="Descrição (opcional)"
                />
                <Select
                  value={formulario.rascunhoCategoriaId}
                  onChange={(e) =>
                    setFormulario({ ...formulario, rascunhoCategoriaId: e.target.value })
                  }
                >
                  {rascunho.categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </Select>
                <div className="flex gap-2">
                  <Button type="button" tamanho="sm" onClick={() => salvarEdicao(produto.id)}>
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    tamanho="sm"
                    variante="secondary"
                    onClick={() => setEditandoId(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    {produto.nome || <span className="italic text-gray-400">Sem nome</span>}
                    {produto.possivelDuplicado && <Badge cor="secondary">duplicado?</Badge>}
                    {produto.precisaRevisao && <Badge cor="yellow">revisar</Badge>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {produto.preco !== null
                      ? `R$ ${produto.preco.toFixed(2)}`
                      : produto.precoTexto
                        ? `Preço não reconhecido: "${produto.precoTexto}"`
                        : 'Sem preço'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    tamanho="sm"
                    variante="secondary"
                    onClick={() => iniciarEdicao(produto)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    tamanho="sm"
                    variante="ghost-danger"
                    onClick={() => excluir(produto.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {pendentes.length === 0 && (
          <p className="text-sm text-gray-500">Tudo publicado! Você pode continuar.</p>
        )}
      </div>

      {erro && <Alert tipo="erro">{erro}</Alert>}
      {resultadoPublicacao && <Alert tipo="info">{resultadoPublicacao}</Alert>}

      <Button type="button" disabled={publicando || pendentes.length === 0} onClick={publicar}>
        {publicando ? 'Publicando...' : 'Publicar cardápio'}
      </Button>
      {pendentes.length === 0 && (
        <Button type="button" variante="secondary" onClick={aoFinalizarRevisao}>
          Continuar
        </Button>
      )}

      {pendentes.length > 0 &&
        (confirmandoDescarte ? (
          <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">
              Isso descarta os {pendentes.length} itens pendentes deste rascunho (o que já foi
              publicado continua no seu cardápio). Não dá pra desfazer.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                tamanho="sm"
                variante="danger"
                onClick={descartar}
                disabled={descartando}
              >
                {descartando ? 'Descartando...' : 'Confirmar descarte'}
              </Button>
              <Button
                type="button"
                tamanho="sm"
                variante="secondary"
                onClick={() => setConfirmandoDescarte(false)}
                disabled={descartando}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variante="ghost-danger"
            onClick={() => setConfirmandoDescarte(true)}
          >
            Não quero corrigir — descartar e escolher outro método
          </Button>
        ))}
    </div>
  );
}
