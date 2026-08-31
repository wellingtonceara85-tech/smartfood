import { FormEvent, useEffect, useState } from 'react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { ApiError, api } from '../lib/api';
import { CategoriaSugestao, SugestaoLojista } from '../types';

const CATEGORIAS: { valor: CategoriaSugestao; rotulo: string }[] = [
  { valor: 'cardapio', rotulo: 'Cardápio' },
  { valor: 'pedidos', rotulo: 'Pedidos' },
  { valor: 'financeiro', rotulo: 'Financeiro' },
  { valor: 'entregas', rotulo: 'Entregas' },
  { valor: 'relatorios', rotulo: 'Relatórios' },
  { valor: 'outro', rotulo: 'Outro' },
];

const ROTULO_STATUS: Record<SugestaoLojista['status'], string> = {
  nova: 'Recebida',
  em_analise: 'Em análise',
  planejada: 'Planejada',
  implementada: 'Implementada',
  nao_planejada: 'Não planejada',
};

export function PainelSugestoes() {
  const [categoria, setCategoria] = useState<CategoriaSugestao>('cardapio');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [sugestoes, setSugestoes] = useState<SugestaoLojista[] | null>(null);

  function carregar() {
    api<SugestaoLojista[]>('/api/admin/sugestoes', { autenticado: true }).then(setSugestoes);
  }

  useEffect(carregar, []);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      await api('/api/admin/sugestoes', {
        method: 'POST',
        autenticado: true,
        body: { categoria, mensagem },
      });
      setMensagem('');
      setSucesso(true);
      carregar();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao enviar sugestão');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Sugestões e melhorias</h2>
        <p className="text-sm text-gray-500">Tem alguma ideia para melhorar o SmartFood?</p>
      </div>

      <Card>
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <Select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaSugestao)}
              className="mt-1"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Sua sugestão</label>
            <Textarea
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Conte sua ideia..."
              className="mt-1"
            />
          </div>
          {erro && <Alert tipo="erro">{erro}</Alert>}
          {sucesso && <Alert tipo="sucesso">Sugestão enviada — obrigado!</Alert>}
          <Button type="submit" disabled={enviando || mensagem.trim().length < 3}>
            {enviando ? 'Enviando...' : 'Enviar sugestão'}
          </Button>
        </form>
      </Card>

      {sugestoes === null ? (
        <Loading />
      ) : (
        sugestoes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Suas sugestões enviadas</p>
            <div className="flex flex-col gap-2">
              {sugestoes.map((s) => (
                <Card key={s.id} className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-700">{s.mensagem}</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {ROTULO_STATUS[s.status]}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
