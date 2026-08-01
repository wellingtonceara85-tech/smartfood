import { CSSProperties } from 'react';
import { montarVariaveisTema } from '../lib/cor';

interface Props {
  nomeLoja: string;
  corPrimaria: string;
  corSecundaria: string;
}

/**
 * Mockup pequeno da loja usando as MESMAS variáveis CSS/tokens que o cardápio
 * público real vai aplicar — isso garante que a pré-visualização reflete
 * fielmente o resultado final, sem precisar renderizar a página inteira.
 */
export function PreviewIdentidadeVisual({ nomeLoja, corPrimaria, corSecundaria }: Props) {
  const variaveis = montarVariaveisTema(corPrimaria, corSecundaria);

  return (
    <div
      style={variaveis as CSSProperties}
      className="overflow-hidden rounded-card border border-gray-200 shadow-card"
    >
      <div className="h-10 bg-primary" />
      <div className="bg-white p-3">
        <p className="text-sm font-bold text-gray-800">{nomeLoja || 'Sua loja'}</p>
        <div className="mt-2 flex gap-3 border-b text-xs">
          <span className="border-b-2 border-primary px-0.5 pb-1 font-medium text-primary-hover">
            Lanches
          </span>
          <span className="px-0.5 pb-1 text-gray-400">Bebidas</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700">X-Burguer</p>
            <p className="text-sm font-bold text-primary-hover">R$ 22,90</p>
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-text"
          >
            Adicionar
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between bg-primary px-3 py-2 text-xs font-medium text-primary-text">
        <span>1 item · R$ 22,90</span>
        <span className="underline">Ver pedido</span>
      </div>
    </div>
  );
}
