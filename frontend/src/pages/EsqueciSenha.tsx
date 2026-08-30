import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { ApiError, api } from '../lib/api';

export function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!turnstileToken) {
      setErro('Confirme a verificação de segurança antes de continuar.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      // Resposta é sempre a mesma, exista ou não o e-mail — não há erro
      // "não encontrado" pra tratar aqui de propósito. Erros de rede/limite
      // de tentativas (429) ou de verificação de segurança ainda precisam
      // de feedback, só esses.
      const resp = await api<{ mensagem: string }>('/api/public/esqueci-senha', {
        method: 'POST',
        body: { email, turnstileToken },
      });
      setMensagem(resp.mensagem);
    } catch (e) {
      setErro(
        (e as ApiError)?.status === 429
          ? 'Muitas tentativas — aguarde alguns minutos e tente de novo.'
          : e instanceof Error
            ? e.message
            : 'Não foi possível enviar. Tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-card-hover">
          <h1 className="mb-1 text-xl font-bold text-gray-800">Esqueci minha senha</h1>
          <p className="mb-4 text-sm text-gray-500">
            Informe o e-mail da sua conta — se ela existir e já estiver ativada, você recebe um link
            para definir uma nova senha.
          </p>

          {mensagem ? (
            <Alert tipo="sucesso">{mensagem}</Alert>
          ) : (
            <form onSubmit={aoEnviar}>
              <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-3"
              />
              <div className="mb-3">
                <TurnstileWidget onToken={setTurnstileToken} />
              </div>
              {erro && (
                <div className="mb-3">
                  <Alert tipo="erro">{erro}</Alert>
                </div>
              )}
              <Button type="submit" disabled={enviando || !turnstileToken} className="w-full">
                {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
          >
            Voltar para o login
          </Link>
        </Card>
      </div>
    </div>
  );
}
