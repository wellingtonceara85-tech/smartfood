import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Usuario } from '../types';

interface ConviteInfo {
  nome: string;
  email: string;
  lojaNome: string | null;
}

const MENSAGEM_LINK_INVALIDO = 'Link de ativação inválido, expirado ou já utilizado.';

export function AtivarConta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { entrarComSessao } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErroCarregamento(MENSAGEM_LINK_INVALIDO);
      setCarregando(false);
      return;
    }
    api<ConviteInfo>(`/api/public/ativacao/${token}`)
      .then(setConvite)
      .catch((e) => setErroCarregamento(e instanceof Error ? e.message : MENSAGEM_LINK_INVALIDO))
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
      navigate('/painel/dashboard');
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
