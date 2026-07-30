import { useState } from 'react';
import { Produto } from '../types';

interface Props {
  produto: Produto;
  aoAdicionar: (produto: Produto, opcao: string | null, quantidade: number) => void;
}

export function CardProduto({ produto, aoAdicionar }: Props) {
  const [opcao, setOpcao] = useState<string>(produto.opcoes?.[0] ?? '');
  const [quantidade, setQuantidade] = useState(1);

  const indisponivel = !produto.disponivel;

  return (
    <div
      className={`flex justify-between gap-3 rounded-lg border bg-white p-3 ${indisponivel ? 'opacity-50' : ''}`}
    >
      <div className="flex flex-1 flex-col">
        <p className="font-medium text-gray-800">{produto.nome}</p>
        {produto.descricao && <p className="text-sm text-gray-500">{produto.descricao}</p>}
        <p className="mt-1 font-semibold text-gray-800">R$ {produto.preco.toFixed(2)}</p>

        {indisponivel ? (
          <p className="mt-2 text-sm text-gray-400">Indisponível no momento</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {produto.opcoes && produto.opcoes.length > 0 && (
              <select
                value={opcao}
                onChange={(e) => setOpcao(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              >
                {produto.opcoes.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="h-7 w-7 rounded-full bg-gray-200 font-bold text-gray-700"
              >
                -
              </button>
              <span className="w-4 text-center text-sm">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => q + 1)}
                className="h-7 w-7 rounded-full bg-gray-200 font-bold text-gray-700"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => aoAdicionar(produto, opcao || null, quantidade)}
              className="ml-auto rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>

      {produto.fotoUrl ? (
        <img
          src={produto.fotoUrl}
          alt={produto.nome}
          className="h-24 w-24 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-100" />
      )}
    </div>
  );
}
