import { useState } from 'react';
import { Produto } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';

interface Props {
  produto: Produto;
  aoFechar: () => void;
  aoAdicionar: (
    produto: Produto,
    opcao: string | null,
    quantidade: number,
    observacao: string | null,
  ) => void;
}

export function ModalProduto({ produto, aoFechar, aoAdicionar }: Props) {
  const [opcao, setOpcao] = useState(produto.opcoes?.[0] ?? '');
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  const total = produto.preco * quantidade;

  function aoConfirmar() {
    aoAdicionar(produto, opcao || null, quantidade, observacao.trim() || null);
    aoFechar();
  }

  return (
    <Modal titulo="" aoFechar={aoFechar}>
      {produto.fotoUrl ? (
        <img
          src={produto.fotoUrl}
          alt={produto.nome}
          className="-mt-3 aspect-[4/3] w-full rounded-lg object-cover"
        />
      ) : (
        <div className="-mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-gray-100 text-gray-300">
          <span aria-hidden="true" className="text-4xl">
            🍽️
          </span>
        </div>
      )}

      <h2 className="mt-3 text-lg font-bold text-gray-800">{produto.nome}</h2>
      {produto.descricao && <p className="mt-1 text-sm text-gray-500">{produto.descricao}</p>}
      <p className="mt-2 text-base font-bold text-primary-hover">R$ {produto.preco.toFixed(2)}</p>

      {produto.opcoes && produto.opcoes.length > 0 && (
        <div className="mt-4">
          <label
            htmlFor="opcao-produto"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Opções
          </label>
          <Select id="opcao-produto" value={opcao} onChange={(e) => setOpcao(e.target.value)}>
            {produto.opcoes.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="observacao-produto"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Alguma observação?
        </label>
        <Textarea
          id="observacao-produto"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Ex.: sem cebola, molho separado, pouco sal..."
          rows={2}
          maxLength={280}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Quantidade
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            aria-label="Diminuir quantidade"
            className="h-8 w-8 rounded-full bg-gray-100 text-lg font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            -
          </button>
          <span className="w-5 text-center font-medium">{quantidade}</span>
          <button
            type="button"
            onClick={() => setQuantidade((q) => q + 1)}
            aria-label="Aumentar quantidade"
            className="h-8 w-8 rounded-full bg-gray-100 text-lg font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>

      <Button
        type="button"
        variante="primary"
        tamanho="md"
        onClick={aoConfirmar}
        aria-label={`Adicionar ${produto.nome} ao pedido — total R$ ${total.toFixed(2)}`}
        className="mt-5 w-full justify-center text-base"
      >
        <span aria-hidden="true">+</span> R$ {total.toFixed(2)}
      </Button>
    </Modal>
  );
}
