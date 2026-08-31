import { useRef, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { ApiError, enviarArquivoCardapioAssistido } from '../../lib/api';

interface Props {
  aoEnviar: () => void;
}

export function CardapioArquivo({ aoEnviar }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoSelecionar(arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      await enviarArquivoCardapioAssistido(arquivo);
      aoEnviar();
    } catch (e) {
      setErro((e as ApiError)?.message ?? 'Erro ao enviar o arquivo');
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        Envie uma foto ou PDF do seu cardápio atual — nossa equipe revisa e ajuda a implantar no
        SmartFood.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        disabled={enviando}
        onChange={(e) => aoSelecionar(e.target.files?.[0])}
        className="text-sm"
      />
      {enviando && <p className="text-xs text-gray-500">Enviando...</p>}
      {erro && <Alert tipo="erro">{erro}</Alert>}
    </Card>
  );
}
