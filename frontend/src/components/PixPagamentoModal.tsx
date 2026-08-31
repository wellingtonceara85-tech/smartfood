import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface Props {
  slug: string;
  pedidoId: string;
  numeroPedido: number;
  total: number;
  chavePix: string | null;
  pixPayload: string | null;
  /** Link já pronto (status "aguardando pagamento") vindo da criação do pedido — usado como destino final e como fallback se /informar-pagamento falhar. */
  linkWhatsappOriginal: string;
  aoFechar: () => void;
}

export function PixPagamentoModal({
  slug,
  pedidoId,
  numeroPedido,
  total,
  chavePix,
  pixPayload,
  linkWhatsappOriginal,
  aoFechar,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function copiarCodigo() {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — sem feedback, cliente copia manualmente
    }
  }

  function continuarSemPagar() {
    // Aba já sai indo pro link original ("aguardando pagamento") — mesmo
    // truque de abrir síncrono com o clique, sem esperar nenhum await, pro
    // celular não bloquear como pop-up.
    const aba = window.open(linkWhatsappOriginal, '_blank');
    if (!aba) window.location.href = linkWhatsappOriginal;
    aoFechar();
  }

  async function jaFizPix() {
    // Abre a aba em branco JÁ aqui, antes do await — se abrir só depois da
    // resposta da API, o navegador não reconhece mais como resposta direta
    // ao clique e bloqueia a aba (mesmo motivo do truque em LojaPublica.tsx).
    const aba = window.open('', '_blank');
    setEnviando(true);
    let destino = linkWhatsappOriginal;
    try {
      // "Já fiz o Pix" NUNCA significa pagamento confirmado — só registra
      // CLIENTE_INFORMOU_PAGAMENTO. Backend nunca aceita gravar mais que
      // isso a partir desse endpoint público (ver public.ts).
      const resposta = await api<{ linkWhatsapp?: string }>(
        `/api/public/lojas/${slug}/pedidos/${pedidoId}/pix/informar-pagamento`,
        { method: 'POST' },
      );
      if (resposta.linkWhatsapp) destino = resposta.linkWhatsapp;
    } catch {
      // Falhou em registrar "informou pagamento" — segue mesmo assim pro
      // WhatsApp com o link original, o pedido já existe de qualquer forma.
    } finally {
      if (aba) aba.location.href = destino;
      else window.location.href = destino;
      setEnviando(false);
      aoFechar();
    }
  }

  return (
    <Modal titulo="Pagamento via Pix" aoFechar={continuarSemPagar}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">Pedido #{numeroPedido}</p>
        <p className="text-2xl font-bold text-gray-800">R$ {total.toFixed(2).replace('.', ',')}</p>

        {pixPayload ? (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-gray-50 p-4">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={pixPayload} size={200} />
            </div>
            <Button type="button" variante="secondary" tamanho="sm" onClick={copiarCodigo}>
              {copiado ? 'Copiado!' : 'Copiar código Pix'}
            </Button>
          </div>
        ) : (
          chavePix && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              <span>
                Chave Pix da loja: <span className="font-medium text-gray-800">{chavePix}</span>
              </span>
            </div>
          )
        )}

        <p className="text-xs text-gray-500">
          Após realizar o Pix, envie o pedido para a loja. A confirmação do pagamento será feita
          pelo estabelecimento.
        </p>

        <Button
          type="button"
          className="w-full justify-center"
          onClick={jaFizPix}
          disabled={enviando}
        >
          Já fiz o Pix — continuar para o WhatsApp
        </Button>
        <Button
          type="button"
          variante="ghost"
          className="w-full justify-center"
          onClick={continuarSemPagar}
          disabled={enviando}
        >
          Continuar sem pagar agora
        </Button>
      </div>
    </Modal>
  );
}
