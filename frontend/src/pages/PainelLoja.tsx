import { FormEvent, useEffect, useState } from 'react';
import { api, enviarFoto } from '../lib/api';
import { Loja } from '../types';

export function PainelLoja() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api<Loja>('/api/admin/loja', { autenticado: true })
      .then(setLoja)
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!loja) return;
    setSalvando(true);
    setMensagem(null);
    try {
      const atualizada = await api<Loja>('/api/admin/loja', {
        method: 'PUT',
        autenticado: true,
        body: {
          nome: loja.nome,
          tagline: loja.tagline || null,
          logoUrl: loja.logoUrl || null,
          endereco: loja.endereco || null,
          telefoneWhatsapp: loja.telefoneWhatsapp,
          horarioAbertura: loja.horarioAbertura || null,
          horarioFechamento: loja.horarioFechamento || null,
          abertoManual: loja.abertoManual,
        },
      });
      setLoja(atualizada);
      setMensagem('Salvo com sucesso.');
    } finally {
      setSalvando(false);
    }
  }

  async function aoSelecionarLogo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !loja) return;

    setEnviandoLogo(true);
    setErro(null);
    try {
      const url = await enviarFoto(arquivo);
      setLoja({ ...loja, logoUrl: url });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar o logo');
    } finally {
      setEnviandoLogo(false);
      evento.target.value = '';
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>;
  if (!loja) return <p className="text-red-600">Não foi possível carregar a loja.</p>;

  return (
    <form onSubmit={salvar} className="flex max-w-md flex-col gap-3">
      <h2 className="font-semibold text-gray-800">Configuração da loja</h2>

      <label className="text-sm font-medium text-gray-700">Nome</label>
      <input
        required
        value={loja.nome}
        onChange={(e) => setLoja({ ...loja, nome: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <label className="text-sm font-medium text-gray-700">Tagline</label>
      <input
        value={loja.tagline ?? ''}
        onChange={(e) => setLoja({ ...loja, tagline: e.target.value })}
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <label className="text-sm font-medium text-gray-700">Logo</label>
      <div className="flex items-center gap-3">
        {loja.logoUrl && (
          <img
            src={loja.logoUrl}
            alt="Logo da loja"
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex flex-col gap-1">
          <input type="file" accept="image/*" onChange={aoSelecionarLogo} className="text-sm" />
          {enviandoLogo && <span className="text-xs text-gray-500">Enviando...</span>}
        </div>
      </div>

      <label className="text-sm font-medium text-gray-700">Endereço</label>
      <input
        value={loja.endereco ?? ''}
        onChange={(e) => setLoja({ ...loja, endereco: e.target.value })}
        placeholder="Rua, número, bairro, cidade"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <label className="text-sm font-medium text-gray-700">
        Telefone WhatsApp (com DDI+DDD, só números)
      </label>
      <input
        required
        value={loja.telefoneWhatsapp}
        onChange={(e) => setLoja({ ...loja, telefoneWhatsapp: e.target.value })}
        placeholder="5585999999999"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Abertura</label>
          <input
            type="time"
            value={loja.horarioAbertura ?? ''}
            onChange={(e) => setLoja({ ...loja, horarioAbertura: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">Fechamento</label>
          <input
            type="time"
            value={loja.horarioFechamento ?? ''}
            onChange={(e) => setLoja({ ...loja, horarioFechamento: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <label className="text-sm font-medium text-gray-700">
        Status manual (sobrepõe o horário)
      </label>
      <select
        value={loja.abertoManual === null ? 'auto' : loja.abertoManual ? 'aberto' : 'fechado'}
        onChange={(e) =>
          setLoja({
            ...loja,
            abertoManual: e.target.value === 'auto' ? null : e.target.value === 'aberto',
          })
        }
        className="rounded-lg border border-gray-300 px-3 py-2"
      >
        <option value="auto">Automático (pelo horário)</option>
        <option value="aberto">Forçar aberto</option>
        <option value="fechado">Forçar fechado</option>
      </select>

      {mensagem && <p className="text-sm text-green-700">{mensagem}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={salvando || enviandoLogo}
        className="mt-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
