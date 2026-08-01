import { useState } from 'react';
import {
  cepValido,
  EnderecoEntrega,
  formatarEnderecoResumo,
  maskCep,
  maskTelefone,
  telefoneValido,
  UFS_BRASIL,
} from '../lib/endereco';
import { BairroEntrega, FormaPagamento, ItemCarrinho } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface Props {
  itens: ItemCarrinho[];
  total: number;
  nome: string;
  aoMudarNome: (valor: string) => void;
  telefone: string;
  aoMudarTelefone: (valor: string) => void;
  aoFinalizar: () => void;
  aoFechar: () => void;
  finalizando: boolean;
  removerItem: (chave: string) => void;
  bairros: BairroEntrega[];
  formaRecebimento: 'entrega' | 'retirada';
  aoMudarFormaRecebimento: (forma: 'entrega' | 'retirada') => void;
  bairroSelecionadoId: string | null;
  aoMudarBairro: (id: string | null) => void;
  taxaEntrega: number;
  chavePix: string | null;
  formaPagamento: FormaPagamento;
  aoMudarFormaPagamento: (forma: FormaPagamento) => void;
  precisaTroco: boolean;
  aoMudarPrecisaTroco: (valor: boolean) => void;
  trocoPara: string;
  aoMudarTrocoPara: (valor: string) => void;
  tipoCartao: 'debito' | 'credito' | null;
  aoMudarTipoCartao: (valor: 'debito' | 'credito') => void;
  endereco: EnderecoEntrega;
  aoMudarEndereco: (campo: keyof EnderecoEntrega, valor: string) => void;
  enderecoSalvo: EnderecoEntrega | null;
  modoEndereco: 'resumo' | 'formulario';
  aoMudarModoEndereco: (modo: 'resumo' | 'formulario') => void;
  enderecoLoja: string | null;
  tentouEnviar: boolean;
}

const OPCOES_PAGAMENTO_BASE: { valor: FormaPagamento; rotulo: string; icone: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro', icone: '💵' },
  { valor: 'cartao', rotulo: 'Cartão', icone: '💳' },
];

const SEGMENTO_ATIVO = 'bg-primary text-primary-text';
const SEGMENTO_INATIVO = 'bg-white text-gray-600 hover:bg-gray-50';
const RUBRICA = 'mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500';
const ERRO_CAMPO = 'mt-1 text-xs text-red-600';

export function ResumoPedido({
  itens,
  total,
  nome,
  aoMudarNome,
  telefone,
  aoMudarTelefone,
  aoFinalizar,
  aoFechar,
  finalizando,
  removerItem,
  bairros,
  formaRecebimento,
  aoMudarFormaRecebimento,
  bairroSelecionadoId,
  aoMudarBairro,
  taxaEntrega,
  chavePix,
  formaPagamento,
  aoMudarFormaPagamento,
  precisaTroco,
  aoMudarPrecisaTroco,
  trocoPara,
  aoMudarTrocoPara,
  tipoCartao,
  aoMudarTipoCartao,
  endereco,
  aoMudarEndereco,
  enderecoSalvo,
  modoEndereco,
  aoMudarModoEndereco,
  enderecoLoja,
  tentouEnviar,
}: Props) {
  const [chavePixCopiada, setChavePixCopiada] = useState(false);

  async function copiarChavePix() {
    if (!chavePix) return;
    try {
      await navigator.clipboard.writeText(chavePix);
      setChavePixCopiada(true);
      setTimeout(() => setChavePixCopiada(false), 2000);
    } catch {
      // clipboard indisponível (ex: contexto não seguro) — sem feedback, cliente copia manualmente
    }
  }

  const entregaSemBairroEscolhido = formaRecebimento === 'entrega' && !bairroSelecionadoId;
  const trocoInvalido =
    formaPagamento === 'dinheiro' &&
    precisaTroco &&
    (!trocoPara.trim() || Number(trocoPara.replace(',', '.')) <= total);
  const cartaoSemTipo = formaPagamento === 'cartao' && !tipoCartao;
  const nomeInvalido = tentouEnviar && !nome.trim();
  const telefoneInvalido = tentouEnviar && !telefoneValido(telefone);
  const mostrarErrosEndereco =
    tentouEnviar && formaRecebimento === 'entrega' && modoEndereco === 'formulario';

  const opcoesPagamento = [
    ...OPCOES_PAGAMENTO_BASE,
    ...(chavePix ? [{ valor: 'pix' as const, rotulo: 'Pix', icone: '📱' }] : []),
  ];

  const bairroAtivoNome = bairros.find((b) => b.id === bairroSelecionadoId)?.nomeBairro ?? null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar resumo do pedido"
        onClick={aoFechar}
        className="fixed inset-0 z-40 bg-black/40"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-base font-semibold text-gray-800">
              <span aria-hidden="true">🛒</span> Seu pedido
            </span>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="rounded-full p-1 text-xl leading-none text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {itens.length > 0 && (
            <ul className="mb-3 max-h-32 overflow-y-auto text-sm">
              {itens.map((item) => (
                <li
                  key={`${item.produtoId}-${item.opcao ?? ''}`}
                  className="flex justify-between py-1"
                >
                  <span>
                    {item.quantidade}x {item.nome}
                    {item.opcao ? ` (${item.opcao})` : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    R$ {(item.preco * item.quantidade).toFixed(2)}
                    <button
                      type="button"
                      onClick={() => removerItem(`${item.produtoId}-${item.opcao ?? ''}`)}
                      className="text-red-600 transition-colors hover:text-red-700"
                      aria-label="Remover item"
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
              {formaRecebimento === 'entrega' && taxaEntrega > 0 && (
                <li className="flex justify-between py-1 text-gray-500">
                  <span>Taxa de entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </li>
              )}
            </ul>
          )}

          {bairros.length > 0 && (
            <div className="mb-3">
              <p className={RUBRICA}>Entrega</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded-lg border border-gray-300">
                  <button
                    type="button"
                    onClick={() => aoMudarFormaRecebimento('retirada')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      formaRecebimento === 'retirada' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                    }`}
                  >
                    <span aria-hidden="true">🏠</span> Retirada
                  </button>
                  <button
                    type="button"
                    onClick={() => aoMudarFormaRecebimento('entrega')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      formaRecebimento === 'entrega' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                    }`}
                  >
                    <span aria-hidden="true">🛵</span> Entrega
                  </button>
                </div>

                {formaRecebimento === 'entrega' && (
                  <select
                    value={bairroSelecionadoId ?? ''}
                    onChange={(e) => aoMudarBairro(e.target.value || null)}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Selecione o bairro</option>
                    {bairros.map((bairro) => (
                      <option key={bairro.id} value={bairro.id}>
                        {bairro.nomeBairro} — R$ {bairro.valorEntrega.toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-col gap-2">
            <p className={RUBRICA}>Seus dados</p>
            <div>
              <Input
                value={nome}
                onChange={(e) => aoMudarNome(e.target.value)}
                placeholder="Seu nome"
                className={nomeInvalido ? 'border-red-400' : ''}
              />
              {nomeInvalido && <p className={ERRO_CAMPO}>Informe seu nome</p>}
            </div>
            <div>
              <Input
                value={telefone}
                onChange={(e) => aoMudarTelefone(maskTelefone(e.target.value))}
                placeholder="Seu telefone com DDD"
                inputMode="tel"
                className={telefoneInvalido ? 'border-red-400' : ''}
              />
              {telefoneInvalido && <p className={ERRO_CAMPO}>Informe um telefone válido com DDD</p>}
            </div>
          </div>

          {formaRecebimento === 'entrega' && (
            <div className="mb-3">
              <p className={RUBRICA}>Endereço de entrega</p>

              {modoEndereco === 'resumo' && enderecoSalvo ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Entregar em</p>
                  <p className="mt-0.5 text-sm text-gray-800">
                    {formatarEnderecoResumo(enderecoSalvo, bairroAtivoNome)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      tamanho="sm"
                      onClick={() => aoMudarModoEndereco('resumo')}
                    >
                      Usar este endereço
                    </Button>
                    <Button
                      type="button"
                      variante="secondary"
                      tamanho="sm"
                      onClick={() => aoMudarModoEndereco('formulario')}
                    >
                      Alterar endereço
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div>
                    <Input
                      value={endereco.cep}
                      onChange={(e) => aoMudarEndereco('cep', maskCep(e.target.value))}
                      placeholder="CEP"
                      inputMode="numeric"
                      className={
                        mostrarErrosEndereco && !cepValido(endereco.cep) ? 'border-red-400' : ''
                      }
                    />
                    {mostrarErrosEndereco && !cepValido(endereco.cep) && (
                      <p className={ERRO_CAMPO}>Informe um CEP válido (8 dígitos)</p>
                    )}
                  </div>

                  <div>
                    <Input
                      value={endereco.logradouro}
                      onChange={(e) => aoMudarEndereco('logradouro', e.target.value)}
                      placeholder="Rua / logradouro"
                      className={
                        mostrarErrosEndereco && !endereco.logradouro.trim() ? 'border-red-400' : ''
                      }
                    />
                    {mostrarErrosEndereco && !endereco.logradouro.trim() && (
                      <p className={ERRO_CAMPO}>Informe a rua</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        value={endereco.numero}
                        onChange={(e) => aoMudarEndereco('numero', e.target.value)}
                        placeholder="Número"
                        inputMode="numeric"
                        className={
                          mostrarErrosEndereco && !endereco.numero.trim() ? 'border-red-400' : ''
                        }
                      />
                      {mostrarErrosEndereco && !endereco.numero.trim() && (
                        <p className={ERRO_CAMPO}>Obrigatório</p>
                      )}
                    </div>
                    <Input
                      value={endereco.complemento ?? ''}
                      onChange={(e) => aoMudarEndereco('complemento', e.target.value)}
                      placeholder="Complemento (opcional)"
                    />
                  </div>

                  <div className="grid grid-cols-[2fr_1fr] gap-2">
                    <div>
                      <Input
                        value={endereco.cidade}
                        onChange={(e) => aoMudarEndereco('cidade', e.target.value)}
                        placeholder="Cidade"
                        className={
                          mostrarErrosEndereco && !endereco.cidade.trim() ? 'border-red-400' : ''
                        }
                      />
                      {mostrarErrosEndereco && !endereco.cidade.trim() && (
                        <p className={ERRO_CAMPO}>Obrigatório</p>
                      )}
                    </div>
                    <div>
                      <Select
                        value={endereco.estado}
                        onChange={(e) => aoMudarEndereco('estado', e.target.value)}
                        className={
                          mostrarErrosEndereco && !endereco.estado.trim() ? 'border-red-400' : ''
                        }
                      >
                        <option value="">UF</option>
                        {UFS_BRASIL.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </Select>
                      {mostrarErrosEndereco && !endereco.estado.trim() && (
                        <p className={ERRO_CAMPO}>Obrigatório</p>
                      )}
                    </div>
                  </div>

                  <Input
                    value={endereco.referencia ?? ''}
                    onChange={(e) => aoMudarEndereco('referencia', e.target.value)}
                    placeholder="Ponto de referência (opcional)"
                  />

                  {enderecoSalvo && (
                    <button
                      type="button"
                      onClick={() => aoMudarModoEndereco('resumo')}
                      className="self-start text-xs font-medium text-primary-hover hover:underline"
                    >
                      Cancelar e usar o endereço salvo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {formaRecebimento === 'retirada' && enderecoLoja && (
            <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700">Retirada no estabelecimento</p>
              <p className="mt-0.5">{enderecoLoja}</p>
            </div>
          )}

          <div className="mb-3">
            <p className={RUBRICA}>Pagamento</p>
            <div className="flex overflow-hidden rounded-lg border border-gray-300">
              {opcoesPagamento.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => aoMudarFormaPagamento(opcao.valor)}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                    formaPagamento === opcao.valor ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                  }`}
                >
                  <span aria-hidden="true">{opcao.icone}</span> {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          {formaPagamento === 'dinheiro' && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Precisa de troco?</span>
              <div className="flex overflow-hidden rounded-lg border border-gray-300">
                <button
                  type="button"
                  onClick={() => aoMudarPrecisaTroco(false)}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    !precisaTroco ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => aoMudarPrecisaTroco(true)}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    precisaTroco ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                  }`}
                >
                  Sim
                </button>
              </div>
              {precisaTroco && (
                <input
                  value={trocoPara}
                  onChange={(e) => aoMudarTrocoPara(e.target.value)}
                  placeholder="Troco para quanto? Ex: 50"
                  inputMode="decimal"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          )}

          {formaPagamento === 'cartao' && (
            <div className="mb-3 flex overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => aoMudarTipoCartao('debito')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  tipoCartao === 'debito' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                }`}
              >
                Débito
              </button>
              <button
                type="button"
                onClick={() => aoMudarTipoCartao('credito')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  tipoCartao === 'credito' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                }`}
              >
                Crédito
              </button>
            </div>
          )}

          {formaPagamento === 'pix' && chavePix && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              <span>
                Chave Pix da loja: <span className="font-medium text-gray-800">{chavePix}</span>
              </span>
              <button
                type="button"
                onClick={copiarChavePix}
                className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-primary-hover shadow-sm transition-colors hover:bg-primary-light"
              >
                {chavePixCopiada ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}

          <p className="mb-3 text-xs text-gray-400">
            Seus dados serão utilizados para processar e entregar este pedido.
          </p>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Total: R$ {total.toFixed(2)}</span>
            <Button
              type="button"
              tamanho="md"
              className="rounded-full px-5 shadow-sm"
              disabled={
                itens.length === 0 ||
                finalizando ||
                entregaSemBairroEscolhido ||
                trocoInvalido ||
                cartaoSemTipo
              }
              onClick={aoFinalizar}
            >
              {finalizando ? 'Enviando...' : 'Finalizar no WhatsApp'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
