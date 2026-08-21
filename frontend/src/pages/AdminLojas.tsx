import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { api } from '../lib/api';
import { corTrial, rotuloTrialCurto } from '../lib/trial';
import { slugificar } from '../lib/slug';
import { BoasVindasGeradas, LojaAdmin, StatusLojaAdmin } from '../types';

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

const FILTROS: { chave: string; rotulo: string }[] = [
  { chave: 'todas', rotulo: 'Todas' },
  { chave: 'ativas', rotulo: 'Ativas' },
  { chave: 'aguardando', rotulo: 'Aguardando ativação' },
  { chave: 'suspensas', rotulo: 'Suspensas' },
  { chave: 'sem_uso', rotulo: 'Sem uso' },
];

const ROTULO_STATUS: Record<StatusLojaAdmin, string> = {
  aguardando_ativacao: 'Aguardando ativação',
  ativa: 'Ativa',
  suspensa: 'Suspensa',
};

const COR_STATUS: Record<StatusLojaAdmin, 'primary' | 'secondary' | 'yellow' | 'red' | 'gray'> = {
  aguardando_ativacao: 'yellow',
  ativa: 'secondary',
  suspensa: 'red',
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function AdminLojas() {
  const [lojas, setLojas] = useState<LojaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [formulario, setFormulario] = useState<FormularioLoja | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [boasVindas, setBoasVindas] = useState<{
    lojaNome: string;
    dados: BoasVindasGeradas;
  } | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erroLinha, setErroLinha] = useState<{ id: string; mensagem: string } | null>(null);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);
  const formularioRef = useRef<HTMLFormElement>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (busca.trim()) params.set('busca', busca.trim());
      if (filtro !== 'todas') params.set('filtro', filtro);
      const query = params.toString();
      const resp = await api<LojaAdmin[]>(`/api/admin-master/lojas${query ? `?${query}` : ''}`, {
        autenticado: true,
      });
      setLojas(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(carregar, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, filtro]);

  useEffect(() => {
    if (formulario) formularioRef.current?.scrollIntoView({ block: 'start' });
  }, [formulario]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!formulario) return;
    setErro(null);
    setSalvando(true);
    try {
      const criada = await api<LojaAdmin & BoasVindasGeradas>('/api/admin-master/lojas', {
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
      setFormulario(null);
      setBoasVindas({
        lojaNome: criada.nome,
        dados: {
          linkAtivacao: criada.linkAtivacao,
          linkCardapio: criada.linkCardapio,
          linkGuiaWhatsapp: criada.linkGuiaWhatsapp,
          mensagemBoasVindas: criada.mensagemBoasVindas,
        },
      });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar loja');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(loja: LojaAdmin) {
    setProcessandoId(loja.id);
    setErroLinha(null);
    try {
      const novoStatus = loja.status === 'suspensa' ? 'ativa' : 'suspensa';
      await api(`/api/admin-master/lojas/${loja.id}/status`, {
        method: 'PATCH',
        autenticado: true,
        body: { status: novoStatus },
      });
      carregar();
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluir(loja: LojaAdmin) {
    setProcessandoId(loja.id);
    setErroLinha(null);
    try {
      await api(`/api/admin-master/lojas/${loja.id}`, { method: 'DELETE', autenticado: true });
      setConfirmandoExclusaoId(null);
      carregar();
    } catch (e) {
      setErroLinha({
        id: loja.id,
        mensagem: e instanceof Error ? e.message : 'Não foi possível excluir a loja',
      });
    } finally {
      setProcessandoId(null);
    }
  }

  async function copiar(texto: string, chave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // clipboard indisponível — o texto já fica visível e selecionável
    }
  }

  const listaVazia = useMemo(() => !carregando && lojas.length === 0, [carregando, lojas]);

  return (
    <div className="flex flex-col gap-4">
      {boasVindas && (
        <Modal titulo={`Loja "${boasVindas.lojaNome}" criada`} aoFechar={() => setBoasVindas(null)}>
          <p className="mb-3 text-sm text-gray-600">
            Envie a mensagem abaixo para o lojista pelo WhatsApp — os links já estão prontos.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              tamanho="sm"
              onClick={() => copiar(boasVindas.dados.mensagemBoasVindas, 'mensagem')}
            >
              {copiado === 'mensagem' ? 'Copiado!' : 'Copiar mensagem de boas-vindas'}
            </Button>
            <Button
              type="button"
              tamanho="sm"
              variante="secondary"
              onClick={() => copiar(boasVindas.dados.linkAtivacao, 'ativacao')}
            >
              {copiado === 'ativacao' ? 'Copiado!' : 'Copiar link de ativação'}
            </Button>
            <Button
              type="button"
              tamanho="sm"
              variante="secondary"
              onClick={() => window.open(boasVindas.dados.linkCardapio, '_blank', 'noreferrer')}
            >
              Abrir cardápio público
            </Button>
            <Button
              type="button"
              tamanho="sm"
              variante="secondary"
              onClick={() => window.open(boasVindas.dados.linkGuiaWhatsapp, '_blank', 'noreferrer')}
            >
              Abrir Guia WhatsApp Business
            </Button>
          </div>
          <textarea
            readOnly
            value={boasVindas.dados.mensagemBoasVindas}
            className="h-64 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700"
            onFocus={(e) => e.target.select()}
          />
        </Modal>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Lojas cadastradas</h2>
        <Button onClick={() => setFormulario(formularioVazio)}>Nova loja</Button>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Buscar por nome da loja"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="w-auto">
          {FILTROS.map((f) => (
            <option key={f.chave} value={f.chave}>
              {f.rotulo}
            </option>
          ))}
        </Select>
      </Card>

      {carregando && <Loading />}

      {listaVazia && (
        <p className="text-sm text-gray-500">Nenhuma loja encontrada para esse filtro.</p>
      )}

      {!carregando && lojas.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Loja</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Produtos</th>
                <th className="px-3 py-2.5">Pedidos</th>
                <th className="px-3 py-2.5">Último acesso</th>
                <th className="px-3 py-2.5">Trial</th>
                <th className="px-3 py-2.5">Cadastro</th>
                <th className="px-3 py-2.5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map((loja) => (
                <tr key={loja.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-800">{loja.nome}</p>
                    <p className="text-xs text-gray-500">/{loja.slug}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge cor={COR_STATUS[loja.status]}>{ROTULO_STATUS[loja.status]}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{loja.totalProdutos}</td>
                  <td className="px-3 py-2.5 text-gray-600">{loja.totalPedidos}</td>
                  <td className="px-3 py-2.5 text-gray-600">{formatarData(loja.ultimoAcessoEm)}</td>
                  <td className="px-3 py-2.5">
                    <Badge cor={corTrial(loja.trial)}>
                      {rotuloTrialCurto(loja.trial, loja.donoAtivado)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{formatarData(loja.criadoEm)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        to={`/admin/lojas/${loja.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Detalhes
                      </Link>
                      <a
                        href={`/${loja.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Cardápio
                      </a>
                      <button
                        type="button"
                        onClick={() => alternarStatus(loja)}
                        disabled={processandoId === loja.id}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {loja.status === 'suspensa' ? 'Reativar' : 'Suspender'}
                      </button>
                      {confirmandoExclusaoId === loja.id ? (
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => excluir(loja)}
                            disabled={processandoId === loja.id}
                            className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            Confirmar exclusão
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoExclusaoId(null)}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmandoExclusaoId(loja.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                    {erroLinha?.id === loja.id && (
                      <p className="mt-1 max-w-xs text-xs text-red-600">{erroLinha.mensagem}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {formulario && (
        <form
          ref={formularioRef}
          onSubmit={salvar}
          className="flex flex-col gap-3 rounded-lg border bg-white p-4"
        >
          <h3 className="font-semibold text-gray-800">Nova loja</h3>

          <Input
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
          />

          <div>
            <label className="text-sm text-gray-600">Link do cardápio: /</label>
            <Input
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
            />
          </div>

          <Input
            required
            placeholder="Telefone WhatsApp (com DDI+DDD, só números)"
            value={formulario.telefoneWhatsapp}
            onChange={(e) =>
              setFormulario((atual) =>
                atual ? { ...atual, telefoneWhatsapp: e.target.value } : atual,
              )
            }
          />

          <hr />
          <p className="text-sm font-medium text-gray-700">Dados do dono da loja</p>
          <p className="-mt-2 text-xs text-gray-500">
            O dono define a própria senha depois, por um link de ativação — você nunca a vê nem a
            define aqui.
          </p>

          <Input
            required
            placeholder="Nome do dono"
            value={formulario.donoNome}
            onChange={(e) =>
              setFormulario((atual) => (atual ? { ...atual, donoNome: e.target.value } : atual))
            }
          />
          <Input
            required
            type="email"
            placeholder="E-mail"
            value={formulario.donoEmail}
            onChange={(e) =>
              setFormulario((atual) => (atual ? { ...atual, donoEmail: e.target.value } : atual))
            }
          />

          {erro && <Alert tipo="erro">{erro}</Alert>}

          <div className="flex gap-2">
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar loja'}
            </Button>
            <Button type="button" variante="secondary" onClick={() => setFormulario(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
