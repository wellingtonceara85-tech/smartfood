import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeHorario } from '../components/BadgeHorario';
import { BarraResumoCompacta } from '../components/BarraResumoCompacta';
import { CardEntregaTopo } from '../components/CardEntregaTopo';
import { CardProduto } from '../components/CardProduto';
import { ModalProduto } from '../components/ModalProduto';
import { ResumoPedido } from '../components/ResumoPedido';
import { agendamentoPareceValido } from '../lib/agendamento';
import { api } from '../lib/api';
import { montarVariaveisTema } from '../lib/cor';
import { distanciaAproximadaMetros, resolverTaxaPorDistancia } from '../lib/distancia';
import { cepValido, EnderecoEntrega, telefoneValido } from '../lib/endereco';
import {
  FormaPagamento,
  ItemCarrinho,
  LojaPublica as LojaPublicaTipo,
  PedidoAnterior,
  Produto,
  TipoPedido,
} from '../types';

const ENDERECO_VAZIO: EnderecoEntrega = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: null,
  bairro: '',
  cidade: '',
  estado: '',
  referencia: null,
};

function enderecoCompleto(valor: unknown): valor is EnderecoEntrega {
  if (!valor || typeof valor !== 'object') return false;
  const e = valor as Partial<EnderecoEntrega>;
  return Boolean(
    e.cep && cepValido(e.cep) && e.logradouro && e.numero && e.bairro && e.cidade && e.estado,
  );
}

interface ClienteSalvo {
  nome?: string;
  telefone?: string;
  endereco?: EnderecoEntrega;
}

function lerClienteSalvo(slug: string): ClienteSalvo | null {
  const bruto = localStorage.getItem(`smartfood_cliente_${slug}`);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as ClienteSalvo;
  } catch {
    return null;
  }
}

export function LojaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const [loja, setLoja] = useState<LojaPublicaTipo | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro');
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState('');
  const [tipoCartao, setTipoCartao] = useState<'debito' | 'credito' | null>(null);
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('imediato');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');
  const [pedidoAnterior, setPedidoAnterior] = useState<PedidoAnterior | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [erroPedido, setErroPedido] = useState<string | null>(null);
  const [formaRecebimento, setFormaRecebimento] = useState<'entrega' | 'retirada'>('retirada');
  const [bairroSelecionadoId, setBairroSelecionadoId] = useState<string | null>(null);
  const [clienteLocalizacao, setClienteLocalizacao] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [obtendoLocalizacao, setObtendoLocalizacao] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [resumoAberto, setResumoAberto] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoEntrega>(ENDERECO_VAZIO);
  const [enderecoSalvo, setEnderecoSalvo] = useState<EnderecoEntrega | null>(null);
  const [modoEndereco, setModoEndereco] = useState<'resumo' | 'formulario'>('formulario');
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [produtoModalAberto, setProdutoModalAberto] = useState<Produto | null>(null);
  const [itemEditando, setItemEditando] = useState<{ chave: string; produto: Produto } | null>(
    null,
  );
  const categoriaRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!slug) return;
    // Reseta o estado da loja anterior antes de buscar a nova — sem isso, ao
    // navegar entre dois cardápios diferentes na mesma sessão (ex: o
    // admin_master abrindo lojas em sequência), o tema/conteúdo da loja
    // anterior ficaria visível por um instante até a nova requisição terminar.
    setLoja(null);
    setErroCarregamento(false);
    setCategoriaAtiva(null);
    api<LojaPublicaTipo>(`/api/public/lojas/${slug}`)
      .then((dados) => {
        setLoja(dados);
        setCategoriaAtiva(dados.categorias[0]?.id ?? null);
      })
      .catch(() => setErroCarregamento(true));
  }, [slug]);

  const variaveisTema = useMemo(
    () =>
      loja
        ? (montarVariaveisTema(loja.corPrimaria, loja.corSecundaria) as CSSProperties)
        : undefined,
    [loja?.corPrimaria, loja?.corSecundaria],
  );

  // Usado para reabrir o modal de personalização a partir de um item do
  // carrinho (Editar): o carrinho só guarda produtoId, então o produto
  // completo (fotoUrl, opções, descrição) precisa ser buscado no cardápio.
  const produtosPorId = useMemo(() => {
    const mapa = new Map<string, Produto>();
    for (const categoria of loja?.categorias ?? []) {
      for (const produto of categoria.produtos) mapa.set(produto.id, produto);
    }
    return mapa;
  }, [loja]);

  // Nome, telefone e — quando existir — endereço da última Entrega ficam só
  // no localStorage deste dispositivo (chave por loja). O backend nunca é
  // consultado por telefone pra devolver endereço: um endpoint público sem
  // autenticação do cliente não pode funcionar como busca de endereço de
  // terceiros só por quem souber (ou tentar) um número de telefone.
  useEffect(() => {
    if (!slug) return;
    const salvo = lerClienteSalvo(slug);
    if (!salvo) return;
    if (salvo.nome) setNome(salvo.nome);
    if (salvo.telefone) setTelefone(salvo.telefone);
    if (enderecoCompleto(salvo.endereco)) {
      setEnderecoSalvo(salvo.endereco);
      setEndereco(salvo.endereco);
      setModoEndereco('resumo');
    }
  }, [slug]);

  // O bairro salvo localmente é só um nome — precisa ser reencontrado na
  // lista atual de bairros ativos da loja (o cadastro pode ter mudado desde
  // o último pedido). Se não achar por nome exato, não inventa associação:
  // o cliente só vê o endereço e precisa escolher o bairro de novo.
  useEffect(() => {
    if (!enderecoSalvo || !loja) return;
    const bairroEncontrado = loja.bairrosEntrega.find((b) => b.nomeBairro === enderecoSalvo.bairro);
    if (bairroEncontrado) setBairroSelecionadoId(bairroEncontrado.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enderecoSalvo !== null, loja !== null]);

  // "Pedir de novo" continua existindo (reconstrói o carrinho e preferências
  // de pagamento a partir do último pedido), mas o endpoint que o alimenta
  // não devolve mais nome/telefone/endereço — só itens e forma de pagamento.
  useEffect(() => {
    if (!slug || telefone.length < 8) {
      setPedidoAnterior(null);
      return;
    }
    const timer = setTimeout(() => {
      api<PedidoAnterior | null>(
        `/api/public/lojas/${slug}/pedidos/ultimo?telefone=${encodeURIComponent(telefone)}`,
      )
        .then(setPedidoAnterior)
        .catch(() => setPedidoAnterior(null));
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, telefone]);

  const produtosBusca = useMemo(() => {
    if (!loja || !busca.trim()) return [];
    const termo = busca.trim().toLowerCase();
    const todos = loja.categorias.flatMap((categoria) => categoria.produtos);
    return todos.filter(
      (produto) =>
        produto.nome.toLowerCase().includes(termo) ||
        produto.descricao?.toLowerCase().includes(termo),
    );
  }, [loja, busca]);

  // Scroll-spy: enquanto o cliente rola a lista única de categorias, destaca na
  // barra fixa qual seção está visível — sem isso a aba ativa ficaria travada
  // na categoria clicada por último, mesmo já tendo rolado pra outra.
  useEffect(() => {
    if (!loja || busca.trim()) return;
    const elementos = Object.entries(categoriaRefs.current).filter(([, el]) => el !== null) as [
      string,
      HTMLDivElement,
    ][];
    if (elementos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiveis = entries.filter((entry) => entry.isIntersecting);
        if (visiveis.length === 0) return;
        const maisProximoDoTopo = visiveis.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        const id = maisProximoDoTopo.target.getAttribute('data-categoria-id');
        if (id) setCategoriaAtiva(id);
      },
      { rootMargin: '-120px 0px -70% 0px', threshold: 0 },
    );
    elementos.forEach(([, el]) => observer.observe(el));
    return () => observer.disconnect();
  }, [loja, busca]);

  function irParaCategoria(categoriaId: string) {
    setCategoriaAtiva(categoriaId);
    categoriaRefs.current[categoriaId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function adicionarAoCarrinho(
    produto: Produto,
    opcao: string | null,
    quantidade: number,
    observacao: string | null,
  ) {
    // Observação entra na chave: dois lançamentos do mesmo produto+opção com
    // observações diferentes ("sem cebola" vs "sem sal") não podem se fundir
    // num único item silenciosamente perdendo uma das observações.
    const chave = `${produto.id}-${opcao ?? ''}-${observacao ?? ''}`;
    setCarrinho((atual) => ({
      ...atual,
      [chave]: {
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        opcao,
        quantidade: (atual[chave]?.quantidade ?? 0) + quantidade,
        observacao,
      },
    }));
  }

  // Produto simples: "+" adiciona 1 unidade direto, sem modal. Toques
  // repetidos incrementam a quantidade (mesma chave, mesmo merge de sempre).
  function adicionarProdutoSimples(produto: Produto) {
    adicionarAoCarrinho(produto, null, 1, null);
  }

  function removerItem(chave: string) {
    setCarrinho((atual) => {
      const copia = { ...atual };
      delete copia[chave];
      return copia;
    });
  }

  function abrirEdicaoItem(chave: string) {
    const item = carrinho[chave];
    const produto = item ? produtosPorId.get(item.produtoId) : undefined;
    if (!item || !produto) return;
    setItemEditando({ chave, produto });
  }

  // Substitui o item pela nova configuração em vez de somar quantidade —
  // diferente de adicionarAoCarrinho, que sempre soma. Se a edição resultar
  // na mesma chave de outro item já existente no carrinho, funde as
  // quantidades (mesmo comportamento de "duas linhas iguais" do resto do app)
  // em vez de sobrescrever silenciosamente aquele outro item.
  function salvarEdicaoItem(
    chaveAntiga: string,
    produto: Produto,
    opcao: string | null,
    quantidade: number,
    observacao: string | null,
  ) {
    setCarrinho((atual) => {
      const copia = { ...atual };
      delete copia[chaveAntiga];
      const novaChave = `${produto.id}-${opcao ?? ''}-${observacao ?? ''}`;
      copia[novaChave] = {
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        opcao,
        quantidade: (copia[novaChave]?.quantidade ?? 0) + quantidade,
        observacao,
      };
      return copia;
    });
  }

  function pedirDeNovo() {
    if (!pedidoAnterior) return;
    const novoCarrinho: Record<string, ItemCarrinho> = {};
    for (const item of pedidoAnterior.itens) {
      novoCarrinho[`${item.produtoId}-${item.opcao ?? ''}-${item.observacao ?? ''}`] = {
        produtoId: item.produtoId,
        nome: item.nome,
        preco: item.precoUnitario,
        opcao: item.opcao,
        quantidade: item.quantidade,
        observacao: item.observacao,
      };
    }
    setCarrinho(novoCarrinho);
    setFormaPagamento(pedidoAnterior.formaPagamento);
    setPrecisaTroco(pedidoAnterior.precisaTroco ?? false);
    setTrocoPara(pedidoAnterior.trocoPara ? String(pedidoAnterior.trocoPara) : '');
    setTipoCartao(pedidoAnterior.tipoCartao ?? null);

    const bairroAindaAtivo = loja?.bairrosEntrega.some(
      (b) => b.id === pedidoAnterior.bairroEntregaId,
    );
    if (pedidoAnterior.formaRecebimento === 'entrega' && bairroAindaAtivo) {
      setFormaRecebimento('entrega');
      setBairroSelecionadoId(pedidoAnterior.bairroEntregaId);
    } else {
      setFormaRecebimento('retirada');
      setBairroSelecionadoId(null);
    }
    if (enderecoSalvo) {
      setEndereco(enderecoSalvo);
      setModoEndereco('resumo');
    }
    setResumoAberto(true);
  }

  const itensCarrinho = Object.values(carrinho);
  const subtotal = itensCarrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const bairroSelecionado = loja?.bairrosEntrega.find((b) => b.id === bairroSelecionadoId) ?? null;

  // Loja com o recurso ligado usa distância (linha reta aproximada) em vez de
  // bairro — nunca as duas estratégias ao mesmo tempo. Sem loja com
  // latitude/longitude ou sem localização do cliente ainda capturada, não dá
  // pra estimar nada (mostrado como "obtenha sua localização", não como R$ 0).
  const modoEntregaDistancia = loja?.calcularEntregaPorDistancia ?? false;
  // Separado do resultado (taxa/faixa) pra poder exibir "Distância aproximada: X"
  // pro cliente mesmo quando ele está fora de cobertura (resultadoDistancia.ok === false).
  const distanciaClienteMetros = useMemo(() => {
    if (!modoEntregaDistancia || !loja || loja.latitude === null || loja.longitude === null) {
      return null;
    }
    if (!clienteLocalizacao) return null;
    return distanciaAproximadaMetros(
      loja.latitude,
      loja.longitude,
      clienteLocalizacao.latitude,
      clienteLocalizacao.longitude,
    );
  }, [modoEntregaDistancia, loja, clienteLocalizacao]);

  const resultadoDistancia = useMemo(() => {
    if (distanciaClienteMetros === null || !loja) return null;
    return resolverTaxaPorDistancia(loja.faixasEntregaDistancia, distanciaClienteMetros);
  }, [distanciaClienteMetros, loja]);

  const entregaPorDistanciaBloqueada =
    formaRecebimento === 'entrega' &&
    modoEntregaDistancia &&
    (!resultadoDistancia || !resultadoDistancia.ok);

  const taxaEntrega =
    formaRecebimento !== 'entrega'
      ? 0
      : modoEntregaDistancia
        ? resultadoDistancia?.ok
          ? resultadoDistancia.valorEntrega
          : 0
        : (bairroSelecionado?.valorEntrega ?? 0);
  const total = subtotal + taxaEntrega;
  const enderecoValido =
    cepValido(endereco.cep) &&
    endereco.logradouro.trim() !== '' &&
    endereco.numero.trim() !== '' &&
    endereco.bairro.trim() !== '' &&
    endereco.cidade.trim() !== '' &&
    endereco.estado.trim() !== '';

  // Fonte única do bairro: o cliente escolhe numa lista (nunca digita), e a
  // escolha alimenta tanto a taxa de entrega quanto o campo bairro do
  // endereço — não existem mais dois controles de bairro desencontrados.
  // Só se aplica no modo bairro — no modo distância o cliente digita o bairro
  // livremente, junto do resto do endereço.
  function mudarBairroSelecionado(id: string | null) {
    setBairroSelecionadoId(id);
    const bairro = loja?.bairrosEntrega.find((b) => b.id === id);
    setEndereco((atual) => ({ ...atual, bairro: bairro?.nomeBairro ?? '' }));
  }

  // Só sob clique explícito (botão "Usar minha localização") — nunca
  // solicitada automaticamente ao abrir o checkout. Se o cliente negar, a
  // Entrega fica bloqueada (nunca inventamos uma taxa), mas Retirada continua
  // disponível — o checkout não fica preso.
  function obterLocalizacaoCliente() {
    if (!navigator.geolocation) {
      setErroLocalizacao('Seu navegador não suporta localização.');
      return;
    }
    setObtendoLocalizacao(true);
    setErroLocalizacao(null);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setClienteLocalizacao({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
        });
        setObtendoLocalizacao(false);
      },
      () => {
        setErroLocalizacao(
          'Não conseguimos obter sua localização. Tente novamente ou escolha Retirada.',
        );
        setObtendoLocalizacao(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  function removerDadosSalvos() {
    if (!slug) return;
    localStorage.removeItem(`smartfood_cliente_${slug}`);
    setNome('');
    setTelefone('');
    setEnderecoSalvo(null);
    setEndereco(ENDERECO_VAZIO);
    setModoEndereco('formulario');
  }

  async function finalizarPedido() {
    setTentouEnviar(true);
    if (!slug || itensCarrinho.length === 0 || !nome.trim() || !telefoneValido(telefone)) return;
    if (formaRecebimento === 'entrega' && !modoEntregaDistancia && !bairroSelecionadoId) return;
    if (formaRecebimento === 'entrega' && modoEntregaDistancia && entregaPorDistanciaBloqueada) {
      return;
    }
    if (formaRecebimento === 'entrega' && !enderecoValido) return;
    if (formaPagamento === 'cartao' && !tipoCartao) return;
    if (formaPagamento === 'dinheiro' && precisaTroco && !trocoPara.trim()) return;
    if (
      loja?.aceitaAgendamento &&
      tipoPedido === 'agendado' &&
      !agendamentoPareceValido(dataAgendamento, horaAgendamento, loja.antecedenciaMinimaMinutos)
    ) {
      return;
    }
    setFinalizando(true);
    setErroPedido(null);

    // Abre a aba já aqui, ainda dentro do clique do usuário — se abrir só depois do
    // await da API, o navegador (principalmente no celular) não reconhece mais como
    // resposta direta ao clique e bloqueia a aba silenciosamente como pop-up.
    const abaWhatsapp = window.open('', '_blank');

    try {
      const resposta = await api<{ linkWhatsapp: string }>(`/api/public/lojas/${slug}/pedidos`, {
        method: 'POST',
        body: {
          clienteNome: nome.trim(),
          clienteTelefone: telefone,
          itens: itensCarrinho.map((item) => ({
            produtoId: item.produtoId,
            opcao: item.opcao,
            quantidade: item.quantidade,
            observacao: item.observacao,
          })),
          formaRecebimento,
          bairroEntregaId:
            formaRecebimento === 'entrega' && !modoEntregaDistancia ? bairroSelecionadoId : null,
          enderecoEntrega: formaRecebimento === 'entrega' ? endereco : null,
          clienteLocalizacao:
            formaRecebimento === 'entrega' && modoEntregaDistancia ? clienteLocalizacao : null,
          formaPagamento,
          precisaTroco: formaPagamento === 'dinheiro' ? precisaTroco : null,
          trocoPara:
            formaPagamento === 'dinheiro' && precisaTroco && trocoPara.trim()
              ? Number(trocoPara.replace(',', '.'))
              : null,
          tipoCartao: formaPagamento === 'cartao' ? tipoCartao : null,
          tipoPedido: loja?.aceitaAgendamento ? tipoPedido : 'imediato',
          dataAgendamentoData:
            loja?.aceitaAgendamento && tipoPedido === 'agendado' ? dataAgendamento : null,
          dataAgendamentoHora:
            loja?.aceitaAgendamento && tipoPedido === 'agendado' ? horaAgendamento : null,
        },
      });
      if (abaWhatsapp) {
        abaWhatsapp.location.href = resposta.linkWhatsapp;
      } else {
        // Aba bloqueada mesmo assim (ex: usuário desativou pop-ups) — navega a própria página.
        window.location.href = resposta.linkWhatsapp;
      }
      // Retirada nunca apaga um endereço já salvo — só Entrega atualiza/grava um novo.
      const enderecoParaSalvar =
        formaRecebimento === 'entrega' ? endereco : (lerClienteSalvo(slug)?.endereco ?? undefined);
      const dadosParaSalvar: ClienteSalvo = { nome: nome.trim(), telefone };
      if (enderecoParaSalvar) dadosParaSalvar.endereco = enderecoParaSalvar;
      localStorage.setItem(`smartfood_cliente_${slug}`, JSON.stringify(dadosParaSalvar));
      setEnderecoSalvo(enderecoCompleto(enderecoParaSalvar) ? enderecoParaSalvar : null);
      setCarrinho({});
      setResumoAberto(false);
      setTentouEnviar(false);
      setTipoPedido('imediato');
      setDataAgendamento('');
      setHoraAgendamento('');
    } catch (e) {
      abaWhatsapp?.close();
      setErroPedido(e instanceof Error ? e.message : 'Não foi possível finalizar o pedido');
    } finally {
      setFinalizando(false);
    }
  }

  if (erroCarregamento) {
    return <p className="p-6 text-center text-gray-600">Loja não encontrada.</p>;
  }

  if (!loja) {
    return <p className="p-6 text-center text-gray-500">Carregando...</p>;
  }

  return (
    <div
      style={variaveisTema}
      className={`min-h-screen bg-gray-50 ${itensCarrinho.length > 0 ? 'pb-20' : 'pb-6'}`}
    >
      <header className="relative bg-white pb-5 text-center">
        {loja.capaUrl ? (
          <div
            className="h-32 bg-cover bg-center sm:h-44"
            style={{ backgroundImage: `url(${loja.capaUrl})` }}
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-primary to-primary-hover sm:h-44" />
        )}

        <BadgeHorario
          aberto={loja.aberto}
          horarioAbertura={loja.horarioAbertura}
          horarioFechamento={loja.horarioFechamento}
        />

        <div className="-mt-14 flex flex-col items-center gap-1 px-4">
          {loja.logoUrl ? (
            <img
              src={loja.logoUrl}
              alt={loja.nome}
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <div className="h-28 w-28 rounded-full border-4 border-white bg-gray-200 shadow-md" />
          )}
          <h1 className="mt-2 text-xl font-bold text-gray-800">{loja.nome}</h1>
          {loja.tagline && <p className="text-sm text-gray-500">{loja.tagline}</p>}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {itensCarrinho.length > 0 && (
          <CardEntregaTopo
            formaRecebimento={formaRecebimento}
            bairroNome={
              modoEntregaDistancia
                ? endereco.bairro.trim() || endereco.logradouro.trim() || null
                : (bairroSelecionado?.nomeBairro ?? null)
            }
            valorEntrega={taxaEntrega}
            aoAlterar={() => setResumoAberto(true)}
          />
        )}

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar produtos por nome ou descrição"
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {pedidoAnterior && (
          <button
            type="button"
            onClick={pedirDeNovo}
            className="mb-3 rounded-full bg-secondary-light px-3 py-1.5 text-sm font-medium text-secondary-hover transition-colors hover:opacity-90"
          >
            Pedir de novo (último pedido)
          </button>
        )}

        {!busca.trim() && (
          <div className="sticky top-0 z-20 -mx-4 mb-4 flex gap-5 overflow-x-auto border-b bg-gray-50 px-4 pb-0 pt-2">
            {loja.categorias.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() => irParaCategoria(categoria.id)}
                className={`shrink-0 border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                  categoriaAtiva === categoria.id
                    ? 'border-primary text-primary-hover'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {categoria.nome}
              </button>
            ))}
          </div>
        )}

        {busca.trim() ? (
          <div className="flex flex-col gap-3">
            {produtosBusca.map((produto) => (
              <CardProduto
                key={produto.id}
                produto={produto}
                aoAdicionarDireto={adicionarProdutoSimples}
                aoAbrirModal={setProdutoModalAberto}
              />
            ))}
            {produtosBusca.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {loja.categorias.map((categoria) => (
              <div
                key={categoria.id}
                ref={(el) => {
                  categoriaRefs.current[categoria.id] = el;
                }}
                data-categoria-id={categoria.id}
                className="scroll-mt-16"
              >
                <h2 className="mb-2 text-lg font-semibold text-gray-800">{categoria.nome}</h2>
                <div className="flex flex-col gap-3">
                  {categoria.produtos.map((produto) => (
                    <CardProduto
                      key={produto.id}
                      produto={produto}
                      aoAdicionarDireto={adicionarProdutoSimples}
                      aoAbrirModal={setProdutoModalAberto}
                    />
                  ))}
                  {categoria.produtos.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum produto nessa categoria.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {erroPedido && <p className="mt-3 text-sm text-red-600">{erroPedido}</p>}
      </div>

      {itensCarrinho.length > 0 && !resumoAberto && (
        <BarraResumoCompacta
          quantidadeItens={itensCarrinho.reduce((soma, item) => soma + item.quantidade, 0)}
          total={total}
          aoAbrir={() => setResumoAberto(true)}
        />
      )}

      {resumoAberto && (
        <ResumoPedido
          itens={itensCarrinho}
          total={total}
          nome={nome}
          aoMudarNome={setNome}
          telefone={telefone}
          aoMudarTelefone={setTelefone}
          aoFinalizar={finalizarPedido}
          aoFechar={() => setResumoAberto(false)}
          finalizando={finalizando}
          removerItem={removerItem}
          editarItem={abrirEdicaoItem}
          bairros={loja.bairrosEntrega}
          formaRecebimento={formaRecebimento}
          aoMudarFormaRecebimento={setFormaRecebimento}
          bairroSelecionadoId={bairroSelecionadoId}
          aoMudarBairro={mudarBairroSelecionado}
          taxaEntrega={taxaEntrega}
          modoEntregaDistancia={modoEntregaDistancia}
          clienteLocalizacao={clienteLocalizacao}
          obtendoLocalizacao={obtendoLocalizacao}
          erroLocalizacao={erroLocalizacao}
          aoObterLocalizacao={obterLocalizacaoCliente}
          entregaPorDistanciaBloqueada={entregaPorDistanciaBloqueada}
          distanciaClienteMetros={distanciaClienteMetros}
          aceitaAgendamento={loja.aceitaAgendamento}
          antecedenciaMinimaMinutos={loja.antecedenciaMinimaMinutos}
          tipoPedido={tipoPedido}
          aoMudarTipoPedido={setTipoPedido}
          dataAgendamento={dataAgendamento}
          aoMudarDataAgendamento={setDataAgendamento}
          horaAgendamento={horaAgendamento}
          aoMudarHoraAgendamento={setHoraAgendamento}
          chavePix={loja.chavePix}
          formaPagamento={formaPagamento}
          aoMudarFormaPagamento={setFormaPagamento}
          precisaTroco={precisaTroco}
          aoMudarPrecisaTroco={setPrecisaTroco}
          trocoPara={trocoPara}
          aoMudarTrocoPara={setTrocoPara}
          tipoCartao={tipoCartao}
          aoMudarTipoCartao={setTipoCartao}
          endereco={endereco}
          aoMudarEndereco={(campo, valor) => setEndereco((atual) => ({ ...atual, [campo]: valor }))}
          enderecoSalvo={enderecoSalvo}
          modoEndereco={modoEndereco}
          aoMudarModoEndereco={(modo) => {
            if (modo === 'formulario' && enderecoSalvo) setEndereco(enderecoSalvo);
            setModoEndereco(modo);
          }}
          enderecoLoja={loja.endereco}
          tentouEnviar={tentouEnviar}
          aoRemoverDadosSalvos={removerDadosSalvos}
        />
      )}

      {produtoModalAberto && (
        <ModalProduto
          produto={produtoModalAberto}
          aoFechar={() => setProdutoModalAberto(null)}
          aoAdicionar={adicionarAoCarrinho}
        />
      )}

      {itemEditando && (
        <ModalProduto
          produto={itemEditando.produto}
          aoFechar={() => setItemEditando(null)}
          aoAdicionar={(produto, opcao, quantidade, observacao) =>
            salvarEdicaoItem(itemEditando.chave, produto, opcao, quantidade, observacao)
          }
          valoresIniciais={{
            opcao: carrinho[itemEditando.chave]?.opcao ?? null,
            quantidade: carrinho[itemEditando.chave]?.quantidade ?? 1,
            observacao: carrinho[itemEditando.chave]?.observacao ?? null,
          }}
          modoEdicao
        />
      )}

      <footer className="mt-6 bg-gray-800 px-4 py-6 text-center text-xs text-gray-300">
        <p className="text-sm font-semibold text-white">{loja.nome}</p>
        {loja.endereco && <p className="mt-1">{loja.endereco}</p>}
        <p className="mt-2 text-gray-400">
          Tecnologia: <span className="font-medium text-gray-300">SmartFood</span>
        </p>
      </footer>
    </div>
  );
}
