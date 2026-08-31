import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { ApiError, api } from '../../lib/api';

const EXEMPLO = 'Espetinho de Carne - 8,00\nEspetinho de Frango - 7,00\nRefrigerante lata - 5,00';

interface Props {
  aoImportar: () => void;
}

export function CardapioColarTexto({ aoImportar }: Props) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function importar() {
    if (!texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await api('/api/admin/rascunho-cardapio/colar-texto', {
        method: 'POST',
        autenticado: true,
        body: { texto },
      });
      aoImportar();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao processar o texto');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Cole abaixo a lista de produtos, um por linha, com o preço no final:
      </p>
      <Textarea
        rows={8}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={EXEMPLO}
      />
      <p className="text-xs text-gray-500">
        Quando não tivermos certeza do preço, o item fica marcado para você revisar — nada é
        inventado.
      </p>
      {erro && <Alert tipo="erro">{erro}</Alert>}
      <Button type="button" disabled={enviando || !texto.trim()} onClick={importar}>
        {enviando ? 'Processando...' : 'Continuar'}
      </Button>
    </Card>
  );
}
