import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { api } from '../lib/api';

const MENSAGEM_LINK_INVALIDO = 'Link de redefinição inválido ou expirado. Solicite um novo.';

export function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState<string | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    if (!token) {
      setErroCarregamento(MENSAGEM_LINK_INVALIDO);
      setCarregando(false);
      return;
    }
    api<{ nome: string }>(`/api/public/redefinir-senha/${token}`)
      .then((resp) => setNome(resp.nome))
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
      await api(`/api/public/redefinir-senha/${token}`, {
        method: 'POST',
        body: { senha, confirmarSenha },
      });
      setConcluido(true);
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : 'Não foi possível redefinir a senha');
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

  if (concluido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm shadow-card-hover">
          <h1 className="mb-2 text-lg font-bold text-gray-800">Senha redefinida com sucesso!</h1>
          <p className="mb-4 text-sm text-gray-600">Use sua nova senha para entrar no SmartFood.</p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Ir para o login
          </Button>
        </Card>
      </div>
    );
  }

  if (erroCarregamento || !nome) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm shadow-card-hover">
          <h1 className="mb-2 text-lg font-bold text-gray-800">Link inválido</h1>
          <Alert tipo="erro">{erroCarregamento ?? MENSAGEM_LINK_INVALIDO}</Alert>
          <Button
            className="mt-4 w-full"
            variante="secondary"
            onClick={() => navigate('/esqueci-senha')}
          >
            Solicitar novo link
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={aoEnviar} className="w-full max-w-sm">
        <Card className="shadow-card-hover">
          <h1 className="mb-1 text-xl font-bold text-gray-800">Defina sua nova senha</h1>
          <p className="mb-4 text-sm text-gray-500">Olá, {nome}</p>

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
            {enviando ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
