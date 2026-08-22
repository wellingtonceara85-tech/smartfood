import { FormEvent, useEffect, useRef, useState } from 'react';
import { ModalImagem } from '../components/ModalImagem';
import { PreviewIdentidadeVisual } from '../components/PreviewIdentidadeVisual';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Select } from '../components/ui/Select';
import {
  COR_PRIMARIA_PADRAO,
  COR_SECUNDARIA_PADRAO,
  PALETAS_PRONTAS,
  PaletaCores,
  corValida,
  normalizarCor,
} from '../lib/cor';
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
  const [corPrimariaTexto, setCorPrimariaTexto] = useState('');
  const [corSecundariaTexto, setCorSecundariaTexto] = useState('');
  const [antecedenciaValor, setAntecedenciaValor] = useState(0);
  const [antecedenciaUnidade, setAntecedenciaUnidade] = useState<'minutos' | 'horas'>('horas');

  const inputLogoRef = useRef<HTMLInputElement>(null);
  const inputCapaRef = useRef<HTMLInputElement>(null);
  const lojaCarregada = loja !== null;

  // Sincroniza os campos de texto só quando a loja termina de carregar — se
  // dependesse do objeto `loja` inteiro, digitar no campo de hex reescreveria
  // o próprio campo a cada tecla.
  useEffect(() => {
    if (loja) {
      setCorPrimariaTexto(loja.corPrimaria);
      setCorSecundariaTexto(loja.corSecundaria);
      const minutos = loja.antecedenciaMinimaMinutos;
      if (minutos > 0 && minutos % 60 === 0) {
        setAntecedenciaValor(minutos / 60);
        setAntecedenciaUnidade('horas');
      } else {
        setAntecedenciaValor(minutos);
        setAntecedenciaUnidade('minutos');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaCarregada]);

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
          corPrimaria: loja.corPrimaria,
          corSecundaria: loja.corSecundaria,
          aceitaAgendamento: loja.aceitaAgendamento,
          antecedenciaMinimaMinutos: loja.antecedenciaMinimaMinutos,
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

  function aoMudarCorPrimariaTexto(valor: string) {
    setCorPrimariaTexto(valor);
    if (loja && corValida(valor)) {
      setLoja({ ...loja, corPrimaria: normalizarCor(valor) });
    }
  }

  function aoMudarCorPrimariaPicker(valor: string) {
    if (!loja) return;
    const normalizado = normalizarCor(valor);
    setCorPrimariaTexto(normalizado);
    setLoja({ ...loja, corPrimaria: normalizado });
  }

  function aoMudarCorSecundariaTexto(valor: string) {
    setCorSecundariaTexto(valor);
    if (loja && corValida(valor)) {
      setLoja({ ...loja, corSecundaria: normalizarCor(valor) });
    }
  }

  function aoMudarCorSecundariaPicker(valor: string) {
    if (!loja) return;
    const normalizado = normalizarCor(valor);
    setCorSecundariaTexto(normalizado);
    setLoja({ ...loja, corSecundaria: normalizado });
  }

  function aplicarPaleta(paleta: PaletaCores) {
    if (!loja) return;
    setLoja({ ...loja, corPrimaria: paleta.primaria, corSecundaria: paleta.secundaria });
    setCorPrimariaTexto(paleta.primaria);
    setCorSecundariaTexto(paleta.secundaria);
  }

  function aoMudarAntecedenciaValor(valor: number) {
    setAntecedenciaValor(valor);
    if (!loja) return;
    const minutos = antecedenciaUnidade === 'horas' ? valor * 60 : valor;
    setLoja({ ...loja, antecedenciaMinimaMinutos: minutos });
  }

  function aoMudarAntecedenciaUnidade(unidade: 'minutos' | 'horas') {
    setAntecedenciaUnidade(unidade);
    if (!loja) return;
    const minutos = unidade === 'horas' ? antecedenciaValor * 60 : antecedenciaValor;
    setLoja({ ...loja, antecedenciaMinimaMinutos: minutos });
  }

  function restaurarPadrao() {
    if (!loja) return;
    const confirmado = confirm(
      'Restaurar as cores padrão do SmartFood? As cores atuais serão substituídas — clique em Salvar depois pra confirmar.',
    );
    if (!confirmado) return;
    setLoja({ ...loja, corPrimaria: COR_PRIMARIA_PADRAO, corSecundaria: COR_SECUNDARIA_PADRAO });
    setCorPrimariaTexto(COR_PRIMARIA_PADRAO);
    setCorSecundariaTexto(COR_SECUNDARIA_PADRAO);
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
        <p className="-mt-2 text-xs text-gray-500">
          Aparece no topo do cardápio público e ajuda o cliente a reconhecer a loja.
        </p>

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
        <p className="-mt-2 text-xs text-gray-500">
          Aparece no rodapé do cardápio — útil pra quem for retirar o pedido no local.
        </p>

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
        <p className="-mt-2 text-xs text-gray-500">
          Define quando o cardápio aparece aberto pros clientes no modo automático. Sem horário
          cadastrado, o cardápio aparece sempre aberto.
        </p>

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
        <p className="-mt-2 text-xs text-gray-500">
          No modo automático, a loja abre e fecha sozinha seguindo o horário configurado acima.
          "Forçar aberto/fechado" ignora o horário até você voltar pro automático.
        </p>

        <div className="mt-2 border-t pt-4">
          <h3 className="text-base font-semibold text-gray-800">Pedidos agendados / Encomendas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Permite que o cliente escolha uma data e horário futuros pra retirada/entrega — útil pra
            encomendas de festas, aniversários e eventos.
          </p>

          <label className="mt-3 flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={loja.aceitaAgendamento}
              onChange={(e) => setLoja({ ...loja, aceitaAgendamento: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            Aceitar pedidos agendados
          </label>

          {loja.aceitaAgendamento && (
            <div className="mt-3 flex items-end gap-2">
              <div>
                <label className={LABEL}>Antecedência mínima</label>
                <Input
                  type="number"
                  min={0}
                  value={antecedenciaValor}
                  onChange={(e) => aoMudarAntecedenciaValor(Math.max(0, Number(e.target.value)))}
                  className="w-24"
                />
              </div>
              <Select
                value={antecedenciaUnidade}
                onChange={(e) => aoMudarAntecedenciaUnidade(e.target.value as 'minutos' | 'horas')}
                className="w-32"
              >
                <option value="minutos">minutos</option>
                <option value="horas">horas</option>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-2 border-t pt-4">
          <h3 className="text-base font-semibold text-gray-800">Identidade visual</h3>
          <p className="mt-1 text-sm text-gray-500">
            Personalize as cores do seu cardápio para combinar com a identidade da sua marca.
          </p>

          <div className="mt-3 flex flex-col gap-4">
            <div>
              <label className={LABEL}>Cor primária</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={corValida(corPrimariaTexto) ? corPrimariaTexto : loja.corPrimaria}
                  onChange={(e) => aoMudarCorPrimariaPicker(e.target.value)}
                  aria-label="Selecionar cor primária"
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                />
                <Input
                  value={corPrimariaTexto}
                  onChange={(e) => aoMudarCorPrimariaTexto(e.target.value)}
                  placeholder="#16A34A"
                  className={!corValida(corPrimariaTexto) ? 'border-red-400' : ''}
                />
              </div>
              {!corValida(corPrimariaTexto) && (
                <p className="mt-1 text-xs text-red-600">
                  Use o formato #RRGGBB, por exemplo #16A34A
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Utilizada nos principais botões, destaques e ações.
              </p>
            </div>

            <div>
              <label className={LABEL}>Cor secundária</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={corValida(corSecundariaTexto) ? corSecundariaTexto : loja.corSecundaria}
                  onChange={(e) => aoMudarCorSecundariaPicker(e.target.value)}
                  aria-label="Selecionar cor secundária"
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                />
                <Input
                  value={corSecundariaTexto}
                  onChange={(e) => aoMudarCorSecundariaTexto(e.target.value)}
                  placeholder="#15803D"
                  className={!corValida(corSecundariaTexto) ? 'border-red-400' : ''}
                />
              </div>
              {!corValida(corSecundariaTexto) && (
                <p className="mt-1 text-xs text-red-600">
                  Use o formato #RRGGBB, por exemplo #15803D
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Utilizada em detalhes complementares e estados de interação.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700">Paletas prontas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETAS_PRONTAS.map((paleta) => (
                <button
                  key={paleta.nome}
                  type="button"
                  onClick={() => aplicarPaleta(paleta)}
                  title={paleta.nome}
                  className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  <span className="flex h-4 w-4 overflow-hidden rounded-full ring-1 ring-black/10">
                    <span className="w-1/2" style={{ backgroundColor: paleta.primaria }} />
                    <span className="w-1/2" style={{ backgroundColor: paleta.secundaria }} />
                  </span>
                  {paleta.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Pré-visualização</p>
            <div className="max-w-xs">
              <PreviewIdentidadeVisual
                nomeLoja={loja.nome}
                corPrimaria={loja.corPrimaria}
                corSecundaria={loja.corSecundaria}
              />
            </div>
          </div>

          <Button
            type="button"
            variante="secondary"
            tamanho="sm"
            onClick={restaurarPadrao}
            className="mt-3"
          >
            Restaurar cores padrão
          </Button>
        </div>

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
