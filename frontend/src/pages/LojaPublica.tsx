import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarraResumoCompacta } from '../components/BarraResumoCompacta';
import { CardProduto } from '../components/CardProduto';
import { ResumoPedido } from '../components/ResumoPedido';
import { api } from '../lib/api';
import {
  FormaPagamento,
  ItemCarrinho,
  LojaPublica as LojaPublicaTipo,
  PedidoAnterior,
  Produto,
} from '../types';

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
  const [pedidoAnterior, setPedidoAnterior] = useState<PedidoAnterior | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [erroPedido, setErroPedido] = useState<string | null>(null);
  const [formaRecebimento, setFormaRecebimento] = useState<'entrega' | 'retirada'>('retirada');
  const [bairroSelecionadoId, setBairroSelecionadoId] = useState<string | null>(null);
  const [resumoAberto, setResumoAberto] = useState(false);
  const categoriaRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!slug) return;
    api<LojaPublicaTipo>(`/api/public/lojas/${slug}`)
      .then((dados) => {
        setLoja(dados);
        setCategoriaAtiva(dados.categorias[0]?.id ?? null);
      })
      .catch(() => setErroCarregamento(true));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const salvo = localStorage.getItem(`smartfood_cliente_${slug}`);
    if (!salvo) return;
    try {
      const { nome: nomeSalvo, telefone: telefoneSalvo } = JSON.parse(salvo);
      if (nomeSalvo) setNome(nomeSalvo);
      if (telefoneSalvo) setTelefone(telefoneSalvo);
    } catch {
      // dado corrompido no localStorage — ignora e segue com os campos vazios
    }
  }, [slug]);

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

  function adicionarAoCarrinho(produto: Produto, opcao: string | null, quantidade: number) {
    const chave = `${produto.id}-${opcao ?? ''}`;
    setCarrinho((atual) => ({
      ...atual,
      [chave]: {
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        opcao,
        quantidade: (atual[chave]?.quantidade ?? 0) + quantidade,
      },
    }));
  }

  function removerItem(chave: string) {
    setCarrinho((atual) => {
      const copia = { ...atual };
      delete copia[chave];
      return copia;
    });
  }

  function pedirDeNovo() {
    if (!pedidoAnterior) return;
    const novoCarrinho: Record<string, ItemCarrinho> = {};
    for (const item of pedidoAnterior.itens) {
      novoCarrinho[`${item.produtoId}-${item.opcao ?? ''}`] = {
        produtoId: item.produtoId,
        nome: item.nome,
        preco: item.precoUnitario,
        opcao: item.opcao,
        quantidade: item.quantidade,
      };
    }
    setCarrinho(novoCarrinho);
    setNome(pedidoAnterior.clienteNome);
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
    setResumoAberto(true);
  }

  const itensCarrinho = Object.values(carrinho);
  const subtotal = itensCarrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const bairroSelecionado = loja?.bairrosEntrega.find((b) => b.id === bairroSelecionadoId) ?? null;
  const taxaEntrega = formaRecebimento === 'entrega' ? (bairroSelecionado?.valorEntrega ?? 0) : 0;
  const total = subtotal + taxaEntrega;

  async function finalizarPedido() {
    if (!slug || itensCarrinho.length === 0 || !telefone || !nome.trim()) return;
    if (formaRecebimento === 'entrega' && !bairroSelecionadoId) return;
    if (formaPagamento === 'cartao' && !tipoCartao) return;
    if (formaPagamento === 'dinheiro' && precisaTroco && !trocoPara.trim()) return;
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
          })),
          formaRecebimento,
          bairroEntregaId: formaRecebimento === 'entrega' ? bairroSelecionadoId : null,
          formaPagamento,
          precisaTroco: formaPagamento === 'dinheiro' ? precisaTroco : null,
          trocoPara:
            formaPagamento === 'dinheiro' && precisaTroco && trocoPara.trim()
              ? Number(trocoPara.replace(',', '.'))
              : null,
          tipoCartao: formaPagamento === 'cartao' ? tipoCartao : null,
        },
      });
      if (abaWhatsapp) {
        abaWhatsapp.location.href = resposta.linkWhatsapp;
      } else {
        // Aba bloqueada mesmo assim (ex: usuário desativou pop-ups) — navega a própria página.
        window.location.href = resposta.linkWhatsapp;
      }
      localStorage.setItem(
        `smartfood_cliente_${slug}`,
        JSON.stringify({ nome: nome.trim(), telefone }),
      );
      setCarrinho({});
      setResumoAberto(false);
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
    <div className={`min-h-screen bg-gray-50 ${itensCarrinho.length > 0 ? 'pb-20' : 'pb-6'}`}>
      <header className="relative bg-white pb-4 text-center">
        {loja.capaUrl ? (
          <div
            className="h-28 bg-cover bg-center"
            style={{ backgroundImage: `url(${loja.capaUrl})` }}
          />
        ) : (
          <div className="h-28 bg-gradient-to-r from-green-600 to-emerald-500" />
        )}

        <span
          className={`absolute right-4 top-4 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow ${
            loja.aberto ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {loja.aberto ? 'Aberto' : 'Fechado'}
        </span>

        <div className="-mt-12 flex flex-col items-center gap-1 px-4">
          {loja.logoUrl ? (
            <img
              src={loja.logoUrl}
              alt={loja.nome}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 shadow-md" />
          )}
          <h1 className="mt-1 text-xl font-bold text-gray-800">{loja.nome}</h1>
          {loja.tagline && <p className="text-sm text-gray-500">{loja.tagline}</p>}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar produtos por nome ou descrição"
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2"
        />

        {pedidoAnterior && (
          <button
            type="button"
            onClick={pedirDeNovo}
            className="mb-3 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700"
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
                className={`shrink-0 border-b-2 px-1 pb-2 text-sm font-medium ${
                  categoriaAtiva === categoria.id
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500'
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
              <CardProduto key={produto.id} produto={produto} aoAdicionar={adicionarAoCarrinho} />
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
                <h2 className="mb-2 text-base font-semibold text-gray-800">{categoria.nome}</h2>
                <div className="flex flex-col gap-3">
                  {categoria.produtos.map((produto) => (
                    <CardProduto
                      key={produto.id}
                      produto={produto}
                      aoAdicionar={adicionarAoCarrinho}
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

      {itensCarrinho.length > 0 && resumoAberto && (
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
          bairros={loja.bairrosEntrega}
          formaRecebimento={formaRecebimento}
          aoMudarFormaRecebimento={setFormaRecebimento}
          bairroSelecionadoId={bairroSelecionadoId}
          aoMudarBairro={setBairroSelecionadoId}
          taxaEntrega={taxaEntrega}
          chavePix={loja.chavePix}
          formaPagamento={formaPagamento}
          aoMudarFormaPagamento={setFormaPagamento}
          precisaTroco={precisaTroco}
          aoMudarPrecisaTroco={setPrecisaTroco}
          trocoPara={trocoPara}
          aoMudarTrocoPara={setTrocoPara}
          tipoCartao={tipoCartao}
          aoMudarTipoCartao={setTipoCartao}
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
