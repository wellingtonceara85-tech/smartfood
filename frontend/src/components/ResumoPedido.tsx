import { useState } from 'react';
import {
  agendamentoPareceValido,
  dataMinimaAgendamento,
  formatarAntecedencia,
} from '../lib/agendamento';
import {
  cepValido,
  EnderecoEntrega,
  formatarEnderecoResumo,
  formatarValorEntrega,
  maskCep,
  maskTelefone,
  telefoneValido,
  UFS_BRASIL,
} from '../lib/endereco';
import { BairroEntrega, FormaPagamento, ItemCarrinho, TipoPedido } from '../types';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
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
  editarItem: (chave: string) => void;
  bairros: BairroEntrega[];
  formaRecebimento: 'entrega' | 'retirada';
  aoMudarFormaRecebimento: (forma: 'entrega' | 'retirada') => void;
  bairroSelecionadoId: string | null;
  aoMudarBairro: (id: string | null) => void;
  taxaEntrega: number;
  aceitaAgendamento: boolean;
  antecedenciaMinimaMinutos: number;
  tipoPedido: TipoPedido;
  aoMudarTipoPedido: (tipo: TipoPedido) => void;
  dataAgendamento: string;
  aoMudarDataAgendamento: (valor: string) => void;
  horaAgendamento: string;
  aoMudarHoraAgendamento: (valor: string) => void;
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
  aoRemoverDadosSalvos: () => void;
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
  editarItem,
  bairros,
  formaRecebimento,
  aoMudarFormaRecebimento,
  bairroSelecionadoId,
  aoMudarBairro,
  taxaEntrega,
  aceitaAgendamento,
  antecedenciaMinimaMinutos,
  tipoPedido,
  aoMudarTipoPedido,
  dataAgendamento,
  aoMudarDataAgendamento,
  horaAgendamento,
  aoMudarHoraAgendamento,
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
  aoRemoverDadosSalvos,
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
  const agendamentoInvalido =
    tipoPedido === 'agendado' &&
    !agendamentoPareceValido(dataAgendamento, horaAgendamento, antecedenciaMinimaMinutos);
  const nomeInvalido = tentouEnviar && !nome.trim();
  const telefoneInvalido = tentouEnviar && !telefoneValido(telefone);
  const mostrarErrosEndereco =
    tentouEnviar && formaRecebimento === 'entrega' && modoEndereco === 'formulario';

  const opcoesPagamento = [
    ...OPCOES_PAGAMENTO_BASE,
    ...(chavePix ? [{ valor: 'pix' as const, rotulo: 'Pix', icone: '📱' }] : []),
  ];

  const subtotal = itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

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

          <button
            type="button"
            onClick={aoFechar}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-primary-hover hover:underline"
          >
            <span aria-hidden="true">←</span> Continuar comprando
          </button>

          {itens.length === 0 ? (
            <EmptyState
              icone="🛒"
              titulo="Seu carrinho está vazio"
              descricao="Volte ao cardápio e adicione itens para continuar seu pedido."
              acao={
                <Button type="button" tamanho="sm" onClick={aoFechar}>
                  Ver cardápio
                </Button>
              }
            />
          ) : (
            <>
              <ul className="mb-3 max-h-56 overflow-y-auto text-sm">
                {itens.map((item) => {
                  const chave = `${item.produtoId}-${item.opcao ?? ''}-${item.observacao ?? ''}`;
                  return (
                    <li
                      key={chave}
                      className="flex flex-col gap-1 border-b border-gray-100 py-2 last:border-0"
                    >
                      <div className="flex justify-between gap-2">
                        <span>
                          {item.quantidade}x {item.nome}
                          {item.opcao ? ` (${item.opcao})` : ''}
                          {item.observacao && (
                            <span className="block text-xs italic text-gray-400">
                              Obs: {item.observacao}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 whitespace-nowrap font-medium text-gray-700">
                          R$ {(item.preco * item.quantidade).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => editarItem(chave)}
                          className="flex items-center gap-1 text-gray-500 transition-colors hover:text-primary-hover"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removerItem(chave)}
                          className="flex items-center gap-1 text-gray-500 transition-colors hover:text-red-600"
                          aria-label={`Remover ${item.nome} do carrinho`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          Remover
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {aceitaAgendamento && (
                <div className="mb-3">
                  <p className={RUBRICA}>Quando você deseja seu pedido?</p>
                  <div className="flex overflow-hidden rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={() => aoMudarTipoPedido('imediato')}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                        tipoPedido === 'imediato' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                      }`}
                    >
                      Para agora
                    </button>
                    <button
                      type="button"
                      onClick={() => aoMudarTipoPedido('agendado')}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                        tipoPedido === 'agendado' ? SEGMENTO_ATIVO : SEGMENTO_INATIVO
                      }`}
                    >
                      Agendar pedido
                    </button>
                  </div>

                  {tipoPedido === 'agendado' && (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={dataAgendamento}
                          min={dataMinimaAgendamento(antecedenciaMinimaMinutos)}
                          onChange={(e) => aoMudarDataAgendamento(e.target.value)}
                          className={`rounded-lg border px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                            agendamentoInvalido && tentouEnviar
                              ? 'border-red-400'
                              : 'border-gray-300'
                          }`}
                        />
                        <input
                          type="time"
                          value={horaAgendamento}
                          onChange={(e) => aoMudarHoraAgendamento(e.target.value)}
                          className={`rounded-lg border px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                            agendamentoInvalido && tentouEnviar
                              ? 'border-red-400'
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Esta loja recebe encomendas com pelo menos{' '}
                        {formatarAntecedencia(antecedenciaMinimaMinutos)} de antecedência.
                      </p>
                      {agendamentoInvalido && tentouEnviar && (
                        <p className={ERRO_CAMPO}>
                          Escolha uma data e horário válidos, respeitando a antecedência mínima.
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
                        <option value="">Selecione seu bairro</option>
                        {bairros.map((bairro) => (
                          <option key={bairro.id} value={bairro.id}>
                            {bairro.nomeBairro} — Entrega{' '}
                            {formatarValorEntrega(bairro.valorEntrega)}
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
                  {telefoneInvalido && (
                    <p className={ERRO_CAMPO}>Informe um telefone válido com DDD</p>
                  )}
                </div>
              </div>

              {formaRecebimento === 'entrega' && (
                <div className="mb-3">
                  <p className={RUBRICA}>Endereço de entrega</p>

                  {modoEndereco === 'resumo' && enderecoSalvo ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">Entregar em</p>
                      <p className="mt-0.5 text-sm text-gray-800">
                        {formatarEnderecoResumo(enderecoSalvo)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
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
                        <button
                          type="button"
                          onClick={aoRemoverDadosSalvos}
                          className="ml-auto text-xs text-gray-400 underline hover:text-gray-600"
                        >
                          Remover dados salvos
                        </button>
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
                            mostrarErrosEndereco && !endereco.logradouro.trim()
                              ? 'border-red-400'
                              : ''
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
                              mostrarErrosEndereco && !endereco.numero.trim()
                                ? 'border-red-400'
                                : ''
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
                              mostrarErrosEndereco && !endereco.cidade.trim()
                                ? 'border-red-400'
                                : ''
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
                              mostrarErrosEndereco && !endereco.estado.trim()
                                ? 'border-red-400'
                                : ''
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

              <div className="mb-3 flex flex-col gap-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {formaRecebimento === 'entrega' && bairroSelecionadoId && (
                  <div className="flex justify-between">
                    <span>Entrega</span>
                    <span>{formatarValorEntrega(taxaEntrega)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-gray-800">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  tamanho="md"
                  className="w-full justify-center rounded-full shadow-sm"
                  disabled={
                    itens.length === 0 ||
                    finalizando ||
                    entregaSemBairroEscolhido ||
                    trocoInvalido ||
                    cartaoSemTipo ||
                    agendamentoInvalido
                  }
                  onClick={aoFinalizar}
                >
                  {finalizando ? 'Enviando...' : 'Finalizar no WhatsApp'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
