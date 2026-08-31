import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { api } from '../lib/api';
import { corTrial, mensagemTrial } from '../lib/trial';
import { BoasVindasGeradas, LojaAdminDetalhe, StatusLojaAdmin } from '../types';

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

function formatarDataHora(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

interface FormularioEdicao {
  nome: string;
  slug: string;
  telefoneWhatsapp: string;
  donoNome: string;
  donoEmail: string;
}

interface LinkRecuperacaoSenha {
  linkRedefinicaoSenha: string;
  expiraEm: string;
}

export function AdminLojaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loja, setLoja] = useState<LojaAdminDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [confirmandoIniciarTrial, setConfirmandoIniciarTrial] = useState(false);
  const [editando, setEditando] = useState<FormularioEdicao | null>(null);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [boasVindas, setBoasVindas] = useState<BoasVindasGeradas | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [confirmandoRecuperacaoSenha, setConfirmandoRecuperacaoSenha] = useState(false);
  const [linkRecuperacaoSenha, setLinkRecuperacaoSenha] = useState<LinkRecuperacaoSenha | null>(
    null,
  );

  async function carregar() {
    if (!id) return;
    setCarregando(true);
    try {
      const resp = await api<LojaAdminDetalhe>(`/api/admin-master/lojas/${id}`, {
        autenticado: true,
      });
      setLoja(resp);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function alternarStatus() {
    if (!loja) return;
    setProcessando(true);
    setErro(null);
    try {
      const novoStatus = loja.status === 'suspensa' ? 'ativa' : 'suspensa';
      await api(`/api/admin-master/lojas/${loja.id}/status`, {
        method: 'PATCH',
        autenticado: true,
        body: { status: novoStatus },
      });
      carregar();
    } finally {
      setProcessando(false);
    }
  }

  async function excluir() {
    if (!loja) return;
    setProcessando(true);
    setErro(null);
    try {
      await api(`/api/admin-master/lojas/${loja.id}`, { method: 'DELETE', autenticado: true });
      navigate('/admin/lojas');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir a loja');
      setConfirmandoExclusao(false);
    } finally {
      setProcessando(false);
    }
  }

  async function iniciarTrial() {
    if (!loja) return;
    setProcessando(true);
    setErro(null);
    try {
      await api(`/api/admin-master/lojas/${loja.id}/trial/iniciar`, {
        method: 'POST',
        autenticado: true,
      });
      setConfirmandoIniciarTrial(false);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível iniciar o trial');
    } finally {
      setProcessando(false);
    }
  }

  async function prorrogarTrial(dias: 7 | 15 | 30) {
    if (!loja) return;
    setProcessando(true);
    setErro(null);
    try {
      await api(`/api/admin-master/lojas/${loja.id}/trial/prorrogar`, {
        method: 'POST',
        autenticado: true,
        body: { dias },
      });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível prorrogar o trial');
    } finally {
      setProcessando(false);
    }
  }

  async function reenviarConvite() {
    if (!loja) return;
    setProcessando(true);
    setErro(null);
    try {
      const resp = await api<BoasVindasGeradas>(`/api/admin-master/lojas/${loja.id}/convite`, {
        method: 'POST',
        autenticado: true,
      });
      setBoasVindas(resp);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar novo link de ativação');
    } finally {
      setProcessando(false);
    }
  }

  // Reaproveita exclusivamente o endpoint já publicado (POST
  // /api/admin-master/lojas/:id/recuperacao-senha) — mesmo mecanismo de token
  // do fluxo self-service. O Admin Master nunca vê nem define a senha em si,
  // só recebe o link de uso único pra repassar manualmente ao lojista.
  async function gerarLinkRecuperacaoSenha() {
    if (!loja) return;
    setProcessando(true);
    setErro(null);
    try {
      const resp = await api<LinkRecuperacaoSenha>(
        `/api/admin-master/lojas/${loja.id}/recuperacao-senha`,
        { method: 'POST', autenticado: true },
      );
      setLinkRecuperacaoSenha(resp);
      setConfirmandoRecuperacaoSenha(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar o link de recuperação');
      setConfirmandoRecuperacaoSenha(false);
    } finally {
      setProcessando(false);
    }
  }

  async function salvarEdicao(evento: React.FormEvent) {
    evento.preventDefault();
    if (!editando || !loja) return;
    setErroEdicao(null);
    setProcessando(true);
    try {
      await api(`/api/admin-master/lojas/${loja.id}`, {
        method: 'PUT',
        autenticado: true,
        body: editando,
      });
      setEditando(null);
      carregar();
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : 'Não foi possível salvar as alterações');
    } finally {
      setProcessando(false);
    }
  }

  async function copiar(texto: string, chave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // clipboard indisponível
    }
  }

  if (carregando) return <Loading />;
  if (!loja) return <p className="text-sm text-gray-500">Loja não encontrada.</p>;

  return (
    <div className="flex flex-col gap-4">
      {boasVindas && (
        <Modal titulo="Novo link de ativação gerado" aoFechar={() => setBoasVindas(null)}>
          <p className="mb-3 text-sm text-gray-600">
            O convite anterior foi revogado. Envie a mensagem abaixo para o lojista.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              tamanho="sm"
              onClick={() => copiar(boasVindas.mensagemBoasVindas, 'mensagem')}
            >
              {copiado === 'mensagem' ? 'Copiado!' : 'Copiar mensagem de boas-vindas'}
            </Button>
            <Button
              type="button"
              tamanho="sm"
              variante="secondary"
              onClick={() => copiar(boasVindas.linkAtivacao, 'ativacao')}
            >
              {copiado === 'ativacao' ? 'Copiado!' : 'Copiar link de ativação'}
            </Button>
          </div>
          <textarea
            readOnly
            value={boasVindas.mensagemBoasVindas}
            className="h-56 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700"
            onFocus={(e) => e.target.select()}
          />
        </Modal>
      )}

      {linkRecuperacaoSenha && (
        <Modal
          titulo="Link de recuperação de senha gerado"
          aoFechar={() => setLinkRecuperacaoSenha(null)}
        >
          <p className="mb-2 text-sm text-gray-600">
            Este link expira em <strong>1 hora</strong> e só pode ser usado <strong>uma vez</strong>
            . Envie-o ao lojista — ele deverá abrir o link e criar a própria nova senha. Você não vê
            nem define a senha dele em nenhum momento.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              tamanho="sm"
              onClick={() => copiar(linkRecuperacaoSenha.linkRedefinicaoSenha, 'recuperacao-senha')}
            >
              {copiado === 'recuperacao-senha' ? 'Copiado!' : 'Copiar link'}
            </Button>
          </div>
          <textarea
            readOnly
            value={linkRecuperacaoSenha.linkRedefinicaoSenha}
            className="h-20 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700"
            onFocus={(e) => e.target.select()}
          />
        </Modal>
      )}

      {editando && (
        <Modal titulo="Editar loja" aoFechar={() => setEditando(null)}>
          <form onSubmit={salvarEdicao} className="flex flex-col gap-3">
            <Input
              required
              placeholder="Nome da loja"
              value={editando.nome}
              onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
            />
            <div>
              <label className="text-sm text-gray-600">Link do cardápio: /</label>
              <Input
                required
                value={editando.slug}
                onChange={(e) =>
                  setEditando({
                    ...editando,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
              />
            </div>
            <Input
              required
              placeholder="Telefone WhatsApp"
              value={editando.telefoneWhatsapp}
              onChange={(e) => setEditando({ ...editando, telefoneWhatsapp: e.target.value })}
            />
            <hr />
            <Input
              required
              placeholder="Nome do dono"
              value={editando.donoNome}
              onChange={(e) => setEditando({ ...editando, donoNome: e.target.value })}
            />
            <Input
              required
              type="email"
              placeholder="E-mail do dono"
              value={editando.donoEmail}
              onChange={(e) => setEditando({ ...editando, donoEmail: e.target.value })}
            />
            {erroEdicao && <Alert tipo="erro">{erroEdicao}</Alert>}
            <div className="flex gap-2">
              <Button type="submit" disabled={processando}>
                {processando ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variante="secondary" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Link to="/admin/lojas" className="text-sm text-blue-600 hover:underline">
        ← Voltar para lojas
      </Link>

      {erro && <Alert tipo="erro">{erro}</Alert>}

      <Card className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">{loja.nome}</h2>
            <Badge cor={COR_STATUS[loja.status]}>{ROTULO_STATUS[loja.status]}</Badge>
          </div>
          <p className="text-sm text-gray-500">/{loja.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            tamanho="sm"
            variante="secondary"
            onClick={() =>
              setEditando({
                nome: loja.nome,
                slug: loja.slug,
                telefoneWhatsapp: loja.telefoneWhatsapp,
                donoNome: loja.donoNome ?? '',
                donoEmail: loja.donoEmail ?? '',
              })
            }
          >
            Editar
          </Button>
          <a href={`/${loja.slug}`} target="_blank" rel="noreferrer">
            <Button tamanho="sm" variante="secondary" type="button">
              Abrir cardápio público
            </Button>
          </a>
          {loja.status === 'aguardando_ativacao' && (
            <Button
              tamanho="sm"
              variante="secondary"
              onClick={reenviarConvite}
              disabled={processando}
            >
              Reenviar link de ativação
            </Button>
          )}
          {loja.donoAtivado &&
            (confirmandoRecuperacaoSenha ? (
              <>
                <Button tamanho="sm" onClick={gerarLinkRecuperacaoSenha} disabled={processando}>
                  {processando ? 'Gerando...' : 'Confirmar geração do link'}
                </Button>
                <Button
                  tamanho="sm"
                  variante="secondary"
                  onClick={() => setConfirmandoRecuperacaoSenha(false)}
                  disabled={processando}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                tamanho="sm"
                variante="secondary"
                onClick={() => setConfirmandoRecuperacaoSenha(true)}
              >
                Gerar link de recuperação de senha
              </Button>
            ))}
          <Button tamanho="sm" variante="secondary" onClick={alternarStatus} disabled={processando}>
            {loja.status === 'suspensa' ? 'Reativar loja' : 'Suspender loja'}
          </Button>
          {confirmandoExclusao ? (
            <>
              <Button tamanho="sm" variante="danger" onClick={excluir} disabled={processando}>
                Confirmar exclusão
              </Button>
              <Button
                tamanho="sm"
                variante="secondary"
                onClick={() => setConfirmandoExclusao(false)}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              tamanho="sm"
              variante="ghost-danger"
              onClick={() => setConfirmandoExclusao(true)}
            >
              Excluir loja
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-gray-800">Dados gerais</h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Proprietário</dt>
              <dd className="text-right text-gray-800">{loja.donoNome ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">E-mail</dt>
              <dd className="text-right text-gray-800">{loja.donoEmail ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">WhatsApp</dt>
              <dd className="text-right text-gray-800">{loja.telefoneWhatsapp}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Endereço</dt>
              <dd className="text-right text-gray-800">{loja.endereco ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Cadastro</dt>
              <dd className="text-right text-gray-800">{formatarDataHora(loja.criadoEm)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Ativação</dt>
              <dd className="text-right text-gray-800">{formatarDataHora(loja.ativadoEm)}</dd>
            </div>
            {loja.status === 'suspensa' && (
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Suspensa em</dt>
                <dd className="text-right text-gray-800">{formatarDataHora(loja.suspensaEm)}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-gray-800">Produtos, pedidos e faturamento</h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Produtos cadastrados</dt>
              <dd className="text-gray-800">{loja.totalProdutos}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Pedidos recebidos</dt>
              <dd className="text-gray-800">{loja.totalPedidos}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Valor movimentado</dt>
              <dd className="text-gray-800">R$ {loja.valorMovimentado.toFixed(2)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-gray-800">Acompanhamento do onboarding</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {loja.onboarding.map((etapa) => (
              <li key={etapa.chave} className="flex items-center gap-2">
                <span aria-hidden="true">{etapa.concluida ? '✅' : '⬜'}</span>
                <span className={etapa.concluida ? 'text-gray-800' : 'text-gray-400'}>
                  {etapa.rotulo}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-gray-800">Acesso / utilização</h3>
          <p className="text-sm text-gray-600">
            Último acesso do proprietário:{' '}
            <span className="font-medium text-gray-800">
              {formatarDataHora(loja.ultimoAcessoEm)}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Sessões/dispositivos simultâneos não são rastreados — a autenticação é feita por token,
            sem sessão de servidor.
          </p>
        </Card>

        <Card className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-800">Trial</h3>
            <Badge cor={corTrial(loja.trial)}>{mensagemTrial(loja.trial, loja.donoAtivado)}</Badge>
          </div>

          {loja.trial.trialFimEm ? (
            <>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div>
                  <dt className="text-gray-500">Início</dt>
                  <dd className="text-gray-800">{formatarDataHora(loja.trial.trialInicioEm)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Término</dt>
                  <dd className="text-gray-800">{formatarDataHora(loja.trial.trialFimEm)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  tamanho="sm"
                  variante="secondary"
                  onClick={() => prorrogarTrial(7)}
                  disabled={processando}
                >
                  +7 dias
                </Button>
                <Button
                  tamanho="sm"
                  variante="secondary"
                  onClick={() => prorrogarTrial(15)}
                  disabled={processando}
                >
                  +15 dias
                </Button>
                <Button
                  tamanho="sm"
                  variante="secondary"
                  onClick={() => prorrogarTrial(30)}
                  disabled={processando}
                >
                  +30 dias
                </Button>
              </div>
            </>
          ) : loja.donoAtivado ? (
            <div className="mt-3">
              <p className="mb-2 text-xs text-gray-500">
                Esta loja foi ativada antes do trial existir (ou o período nunca foi definido) —
                nenhuma data foi presumida. Inicie manualmente se fizer sentido pra esta loja.
              </p>
              {confirmandoIniciarTrial ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button tamanho="sm" onClick={iniciarTrial} disabled={processando}>
                    Confirmar início do trial de 30 dias
                  </Button>
                  <Button
                    tamanho="sm"
                    variante="secondary"
                    onClick={() => setConfirmandoIniciarTrial(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button tamanho="sm" onClick={() => setConfirmandoIniciarTrial(true)}>
                  Iniciar trial de 30 dias
                </Button>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
