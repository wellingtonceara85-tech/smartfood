import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { ApiError, api } from '../lib/api';
import { Usuario } from '../types';

interface ConviteInfo {
  nome: string;
  email: string;
  lojaNome: string | null;
}

const MENSAGEM_LINK_INVALIDO = 'Link de ativação inválido, expirado ou já utilizado.';

function motivoDoErro(e: unknown): string | undefined {
  return e instanceof Error ? (e as ApiError).motivo : undefined;
}

export function AtivarConta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { entrarComSessao } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [conviteJaUsado, setConviteJaUsado] = useState(false);

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [ativado, setAtivado] = useState(false);

  useEffect(() => {
    if (!token) {
      setErroCarregamento(MENSAGEM_LINK_INVALIDO);
      setCarregando(false);
      return;
    }
    api<ConviteInfo>(`/api/public/ativacao/${token}`)
      .then(setConvite)
      .catch((e) => {
        setErroCarregamento(e instanceof Error ? e.message : MENSAGEM_LINK_INVALIDO);
        setConviteJaUsado(motivoDoErro(e) === 'usado');
      })
      .finally(() => setCarregando(false));
  }, [token]);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErroEnvio(null);
    if (senha.length < 6) {
      setErroEnvio('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    if (senha !== confirmarSenha) {
      setErroEnvio('As senhas não conferem');
      return;
    }
    setEnviando(true);
    try {
      const resp = await api<{ accessToken: string; refreshToken: string; usuario: Usuario }>(
        `/api/public/ativacao/${token}`,
        { method: 'POST', body: { senha, confirmarSenha } },
      );
      entrarComSessao(resp.accessToken, resp.refreshToken, resp.usuario);
      setAtivado(true);
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : 'Não foi possível ativar a conta');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (ativado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm shadow-card-hover">
          <h1 className="mb-2 text-lg font-bold text-gray-800">Conta ativada com sucesso!</h1>
          <p className="mb-4 text-sm text-gray-600">
            Nos próximos acessos, entre normalmente no SmartFood usando seu e-mail e senha.
          </p>
          <Button className="w-full" onClick={() => navigate('/painel/dashboard')}>
            Acessar meu painel
          </Button>
          <Link
            to="/ajuda/instalar-smartfood"
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
          >
            Como adicionar o SmartFood à tela inicial
          </Link>
        </Card>
      </div>
    );
  }

  if (conviteJaUsado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm shadow-card-hover">
          <h1 className="mb-2 text-lg font-bold text-gray-800">Esta conta já foi ativada.</h1>
          <p className="mb-4 text-sm text-gray-500">
            Este link era somente para o primeiro acesso. Para entrar novamente, utilize seu e-mail
            e senha.
          </p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Ir para o login
          </Button>
        </Card>
      </div>
    );
  }

  if (erroCarregamento || !convite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm shadow-card-hover">
          <h1 className="mb-2 text-lg font-bold text-gray-800">Link inválido</h1>
          <Alert tipo="erro">{erroCarregamento ?? MENSAGEM_LINK_INVALIDO}</Alert>
          <p className="mt-3 text-sm text-gray-500">
            Peça um novo link de ativação para quem administra a plataforma.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={aoEnviar} className="w-full max-w-sm">
        <Card className="shadow-card-hover">
          <h1 className="mb-1 text-xl font-bold text-gray-800">Ativar sua conta</h1>
          <p className="mb-4 text-sm text-gray-500">
            {convite.lojaNome ? `${convite.lojaNome} — ` : ''}
            {convite.email}
          </p>

          <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
          <Input
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mb-3"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar senha</label>
          <Input
            type="password"
            required
            minLength={6}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="mb-4"
          />

          {erroEnvio && (
            <div className="mb-3">
              <Alert tipo="erro">{erroEnvio}</Alert>
            </div>
          )}

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Ativando...' : 'Ativar conta'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
