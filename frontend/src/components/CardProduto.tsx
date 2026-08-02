import { useState } from 'react';
import { produtoConfiguravel } from '../lib/produto';
import { Produto } from '../types';
import { Card } from './ui/Card';

interface Props {
  produto: Produto;
  aoAdicionarDireto: (produto: Produto) => void;
  aoAbrirModal: (produto: Produto) => void;
}

export function CardProduto({ produto, aoAdicionarDireto, aoAbrirModal }: Props) {
  const [confirmado, setConfirmado] = useState(false);
  const indisponivel = !produto.disponivel;
  const configuravel = produtoConfiguravel(produto);

  function aoClicarCard() {
    if (indisponivel) return;
    if (configuravel) aoAbrirModal(produto);
  }

  function aoClicarMais(e: React.MouseEvent) {
    e.stopPropagation();
    if (configuravel) {
      aoAbrirModal(produto);
      return;
    }
    aoAdicionarDireto(produto);
    setConfirmado(true);
    setTimeout(() => setConfirmado(false), 600);
  }

  return (
    <Card
      onClick={aoClicarCard}
      className={`flex justify-between gap-4 p-4 transition-shadow duration-150 hover:shadow-card-hover ${indisponivel ? 'opacity-60' : ''} ${configuravel && !indisponivel ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-1 flex-col">
        <p className="font-semibold text-gray-800">{produto.nome}</p>
        {produto.descricao && (
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{produto.descricao}</p>
        )}
        <p className="mt-1.5 text-base font-bold text-primary-hover">
          R$ {produto.preco.toFixed(2)}
        </p>

        {indisponivel && (
          <span className="mt-2 inline-flex w-fit items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            Indisponível no momento
          </span>
        )}
      </div>

      <div className="relative shrink-0">
        {produto.fotoUrl ? (
          <img
            src={produto.fotoUrl}
            alt={produto.nome}
            className="h-28 w-28 rounded-lg object-cover"
          />
        ) : (
          <div className="h-28 w-28 rounded-lg bg-gray-100" />
        )}

        {!indisponivel && (
          <button
            type="button"
            onClick={aoClicarMais}
            aria-label={`Adicionar ${produto.nome}`}
            className="absolute bottom-[1px] right-0 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary text-primary-text shadow-sm ring-2 ring-white transition-transform hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
          >
            {/* SVG em vez de caractere de texto: o glifo "+"/"✓" nunca fica
                geometricamente centrado no próprio box da fonte (ascent/descent
                assimétricos variam por fonte/navegador) — um ícone vetorial
                centraliza de verdade dentro do flex, sem depender de métricas
                de fonte. */}
            {confirmado ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3.5}
                strokeLinecap="round"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        )}
      </div>
    </Card>
  );
}
