import { useState } from 'react';
import { Produto } from '../types';
import { Card } from './ui/Card';

interface Props {
  produto: Produto;
  aoAdicionar: (produto: Produto, opcao: string | null, quantidade: number) => void;
}

export function CardProduto({ produto, aoAdicionar }: Props) {
  const [opcao, setOpcao] = useState<string>(produto.opcoes?.[0] ?? '');
  const [quantidade, setQuantidade] = useState(1);

  const indisponivel = !produto.disponivel;

  return (
    <Card
      className={`flex justify-between gap-4 p-4 transition-shadow duration-150 hover:shadow-card-hover ${indisponivel ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-1 flex-col">
        <p className="font-semibold text-gray-800">{produto.nome}</p>
        {produto.descricao && (
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{produto.descricao}</p>
        )}
        <p className="mt-1.5 text-base font-bold text-primary-hover">
          R$ {produto.preco.toFixed(2)}
        </p>

        {indisponivel ? (
          <span className="mt-2 inline-flex w-fit items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            Indisponível no momento
          </span>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {produto.opcoes && produto.opcoes.length > 0 && (
              <select
                value={opcao}
                onChange={(e) => setOpcao(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                aria-label="Diminuir quantidade"
                className="h-7 w-7 rounded-full bg-gray-100 font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                -
              </button>
              <span className="w-4 text-center text-sm">{quantidade}</span>
              <button
                type="button"
                onClick={() => setQuantidade((q) => q + 1)}
                aria-label="Aumentar quantidade"
                className="h-7 w-7 rounded-full bg-gray-100 font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => aoAdicionar(produto, opcao || null, quantidade)}
              className="ml-auto rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
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
          className="h-28 w-28 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-28 w-28 shrink-0 rounded-lg bg-gray-100" />
      )}
    </Card>
  );
}
