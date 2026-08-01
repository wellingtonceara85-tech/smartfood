import { FormEvent, useEffect, useRef, useState } from 'react';
import { ModalImagem } from '../components/ModalImagem';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import { api, enviarFoto } from '../lib/api';
import { Loja } from '../types';

const LABEL = 'text-sm font-medium text-gray-700';

export function PainelLoja() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState<'logo' | 'capa' | null>(null);

  const inputLogoRef = useRef<HTMLInputElement>(null);
  const inputCapaRef = useRef<HTMLInputElement>(null);

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
          capaUrl: loja.capaUrl || null,
          endereco: loja.endereco || null,
          chavePix: loja.chavePix || null,
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

  async function aoSelecionarCapa(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !loja) return;

    setEnviandoCapa(true);
    setErro(null);
    try {
      const url = await enviarFoto(arquivo);
      setLoja({ ...loja, capaUrl: url });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar a capa');
    } finally {
      setEnviandoCapa(false);
      evento.target.value = '';
    }
  }

  if (carregando) return <Loading />;
  if (!loja) return <Alert tipo="erro">Não foi possível carregar a loja.</Alert>;

  return (
    <form onSubmit={salvar} className="max-w-md">
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Configuração da loja</h2>

        <label className={LABEL}>Nome</label>
        <Input
          required
          value={loja.nome}
          onChange={(e) => setLoja({ ...loja, nome: e.target.value })}
        />

        <label className={LABEL}>Tagline</label>
        <Input
          value={loja.tagline ?? ''}
          onChange={(e) => setLoja({ ...loja, tagline: e.target.value })}
        />

        <label className={LABEL}>Logo</label>
        <div className="flex items-center gap-3">
          {loja.logoUrl && (
            <button type="button" onClick={() => setModalAberto('logo')} className="shrink-0">
              <img
                src={loja.logoUrl}
                alt="Logo da loja"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-gray-200"
              />
            </button>
          )}
          <div className="flex flex-col gap-1">
            <input
              ref={inputLogoRef}
              type="file"
              accept="image/*"
              onChange={aoSelecionarLogo}
              className="text-sm"
            />
            {enviandoLogo && <span className="text-xs text-gray-500">Enviando...</span>}
          </div>
        </div>

        <label className={LABEL}>Capa</label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => loja.capaUrl && setModalAberto('capa')}
            className="aspect-[3/1] w-full max-w-sm overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200"
          >
            {loja.capaUrl ? (
              <img src={loja.capaUrl} alt="Capa da loja" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                Sem capa cadastrada
              </div>
            )}
          </button>
          <div className="flex flex-col gap-1">
            <input
              ref={inputCapaRef}
              type="file"
              accept="image/*"
              onChange={aoSelecionarCapa}
              className="text-sm"
            />
            {enviandoCapa && <span className="text-xs text-gray-500">Enviando...</span>}
          </div>
          <p className="text-xs text-gray-500">
            Recomendado: imagem horizontal, mínimo 1200x400px, pra não ficar borrada
          </p>
        </div>

        <label className={LABEL}>Endereço</label>
        <Input
          value={loja.endereco ?? ''}
          onChange={(e) => setLoja({ ...loja, endereco: e.target.value })}
          placeholder="Rua, número, bairro, cidade"
        />

        <label className={LABEL}>Chave Pix</label>
        <Input
          value={loja.chavePix ?? ''}
          onChange={(e) => setLoja({ ...loja, chavePix: e.target.value })}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
        />
        <p className="-mt-2 text-xs text-gray-500">
          Aparece pro cliente no WhatsApp quando ele escolher pagar via Pix.
        </p>

        <label className={LABEL}>Telefone WhatsApp (com DDI+DDD, só números)</label>
        <Input
          required
          value={loja.telefoneWhatsapp}
          onChange={(e) => setLoja({ ...loja, telefoneWhatsapp: e.target.value })}
          placeholder="5585999999999"
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={LABEL}>Abertura</label>
            <Input
              type="time"
              value={loja.horarioAbertura ?? ''}
              onChange={(e) => setLoja({ ...loja, horarioAbertura: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className={LABEL}>Fechamento</label>
            <Input
              type="time"
              value={loja.horarioFechamento ?? ''}
              onChange={(e) => setLoja({ ...loja, horarioFechamento: e.target.value })}
            />
          </div>
        </div>

        <label className={LABEL}>Status manual (sobrepõe o horário)</label>
        <Select
          value={loja.abertoManual === null ? 'auto' : loja.abertoManual ? 'aberto' : 'fechado'}
          onChange={(e) =>
            setLoja({
              ...loja,
              abertoManual: e.target.value === 'auto' ? null : e.target.value === 'aberto',
            })
          }
        >
          <option value="auto">Automático (pelo horário)</option>
          <option value="aberto">Forçar aberto</option>
          <option value="fechado">Forçar fechado</option>
        </Select>

        {mensagem && <Alert tipo="sucesso">{mensagem}</Alert>}
        {erro && <Alert tipo="erro">{erro}</Alert>}

        <Button type="submit" disabled={salvando || enviandoLogo || enviandoCapa} className="mt-2">
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </Card>

      {modalAberto === 'logo' && loja.logoUrl && (
        <ModalImagem
          titulo="Logo da loja"
          src={loja.logoUrl}
          aoFechar={() => setModalAberto(null)}
          aoAlterar={() => {
            setModalAberto(null);
            inputLogoRef.current?.click();
          }}
        />
      )}

      {modalAberto === 'capa' && loja.capaUrl && (
        <ModalImagem
          titulo="Capa da loja"
          src={loja.capaUrl}
          aoFechar={() => setModalAberto(null)}
          aoAlterar={() => {
            setModalAberto(null);
            inputCapaRef.current?.click();
          }}
        />
      )}
    </form>
  );
}
