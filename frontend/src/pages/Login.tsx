import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, carregando } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    try {
      const usuario = await login(email, senha);
      navigate(usuario.papel === 'admin_master' ? '/admin/lojas' : '/painel/dashboard');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao entrar');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={aoEnviar} className="w-full max-w-sm">
        <Card className="shadow-card-hover">
          <h1 className="mb-4 text-xl font-bold text-gray-800">Entrar</h1>

          <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
          <Input
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mb-2"
          />
          <Link
            to="/esqueci-senha"
            className="mb-4 block text-right text-xs font-medium text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>

          {erro && (
            <div className="mb-3">
              <Alert tipo="erro">{erro}</Alert>
            </div>
          )}

          <Button type="submit" disabled={carregando} className="w-full">
            {carregando ? 'Entrando...' : 'Entrar'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
