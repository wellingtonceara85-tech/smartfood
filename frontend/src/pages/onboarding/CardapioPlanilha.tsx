import { useRef, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { ApiError, enviarPlanilhaCardapio } from '../../lib/api';

interface Props {
  aoImportar: () => void;
}

export function CardapioPlanilha({ aoImportar }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoSelecionar(arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      await enviarPlanilhaCardapio(arquivo);
      aoImportar();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao importar a planilha');
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Envie um arquivo <strong>.xlsx</strong> ou <strong>.csv</strong> com colunas de categoria,
        produto, descrição, preço, disponibilidade e observações — os nomes das colunas podem variar
        um pouco, o sistema tenta reconhecer.
      </p>
      <p className="text-xs text-gray-500">
        Nada é publicado direto: você vai revisar tudo antes de colocar no ar.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        disabled={enviando}
        onChange={(e) => aoSelecionar(e.target.files?.[0])}
        className="text-sm"
      />
      {enviando && <p className="text-xs text-gray-500">Importando...</p>}
      {erro && <Alert tipo="erro">{erro}</Alert>}
    </Card>
  );
}
