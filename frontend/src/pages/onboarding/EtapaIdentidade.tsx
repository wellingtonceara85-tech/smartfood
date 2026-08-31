import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { enviarFoto } from '../../lib/api';
import { Loja } from '../../types';

interface Props {
  loja: Loja;
  salvando: boolean;
  aoContinuar: (dados: { nome: string; logoUrl: string | null; capaUrl: string | null }) => void;
}

export function EtapaIdentidade({ loja, salvando, aoContinuar }: Props) {
  const [nome, setNome] = useState(loja.nome);
  const [logoUrl, setLogoUrl] = useState(loja.logoUrl);
  const [capaUrl, setCapaUrl] = useState(loja.capaUrl);
  const [enviando, setEnviando] = useState<'logo' | 'capa' | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function aoSelecionarArquivo(tipo: 'logo' | 'capa', arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviando(tipo);
    setErro(null);
    try {
      const url = await enviarFoto(arquivo);
      if (tipo === 'logo') setLogoUrl(url);
      else setCapaUrl(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar imagem');
    } finally {
      setEnviando(null);
    }
  }

  const semFotos = !logoUrl && !capaUrl;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Nome da loja</label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Logo</label>
        <div className="mt-1 flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo da loja"
              className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => aoSelecionarArquivo('logo', e.target.files?.[0])}
            className="text-xs"
          />
        </div>
        {enviando === 'logo' && <p className="mt-1 text-xs text-gray-500">Enviando...</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Capa</label>
        <div className="mt-1 flex flex-col gap-2">
          {capaUrl && (
            <img
              src={capaUrl}
              alt="Capa da loja"
              className="aspect-[3/1] w-full rounded-lg object-cover ring-1 ring-gray-200"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => aoSelecionarArquivo('capa', e.target.files?.[0])}
            className="text-xs"
          />
        </div>
        {enviando === 'capa' && <p className="mt-1 text-xs text-gray-500">Enviando...</p>}
      </div>

      {erro && <Alert tipo="erro">{erro}</Alert>}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={salvando || enviando !== null}
          onClick={() => aoContinuar({ nome, logoUrl, capaUrl })}
        >
          {salvando ? 'Salvando...' : 'Continuar'}
        </Button>
        {semFotos && (
          <Button
            type="button"
            variante="ghost"
            disabled={salvando || enviando !== null}
            onClick={() => aoContinuar({ nome, logoUrl, capaUrl })}
          >
            Pular por enquanto
          </Button>
        )}
      </div>
    </Card>
  );
}
