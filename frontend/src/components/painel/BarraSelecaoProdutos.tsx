import { useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Categoria } from '../../types';

interface Props {
  quantidade: number;
  categorias: Categoria[];
  movendo: boolean;
  aoMover: (categoriaId: string) => void;
  aoCancelar: () => void;
}

/**
 * Barra fixa no rodapé — fica acima da bottom nav no mobile (que também é
 * fixa) e vira um card ancorado no canto em telas maiores, onde não existe
 * bottom nav disputando o mesmo espaço.
 */
export function BarraSelecaoProdutos({
  quantidade,
  categorias,
  movendo,
  aoMover,
  aoCancelar,
}: Props) {
  const [categoriaDestino, setCategoriaDestino] = useState('');

  if (quantidade === 0) return null;

  function aoClicarMover() {
    if (!categoriaDestino) return;
    const nomeDestino = categorias.find((c) => c.id === categoriaDestino)?.nome ?? '';
    const confirmado = confirm(
      `Mover ${quantidade} ${quantidade === 1 ? 'produto' : 'produtos'} para "${nomeDestino}"?`,
    );
    if (!confirmado) return;
    aoMover(categoriaDestino);
  }

  return (
    // `bottom` acompanha a altura da bottom nav fixa (56px) + a safe-area do
    // iPhone — sem isso a barra ficaria escondida atrás da navegação, igual
    // ao BotaoSilenciarAlerta já resolve pro mesmo problema. Em telas
    // grandes (lg+) não existe bottom nav, então vira um card ancorado no
    // canto.
    <div className="fixed inset-x-2 bottom-[calc(56px+env(safe-area-inset-bottom)+0.5rem)] z-30 rounded-card border border-gray-200 bg-white px-4 py-3 shadow-card-hover lg:inset-x-auto lg:bottom-4 lg:right-4 lg:w-96">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2 lg:mx-0 lg:max-w-none">
        <span className="text-sm font-semibold text-gray-800">
          {quantidade} {quantidade === 1 ? 'selecionado' : 'selecionados'}
        </span>
        <Select
          value={categoriaDestino}
          onChange={(e) => setCategoriaDestino(e.target.value)}
          className="min-w-0 flex-1"
          aria-label="Mover para categoria"
        >
          <option value="">Mover para categoria...</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </Select>
        <Button
          tamanho="sm"
          onClick={aoClicarMover}
          disabled={!categoriaDestino || movendo}
          className="shrink-0"
        >
          {movendo ? 'Movendo...' : 'Mover'}
        </Button>
        <Button
          variante="secondary"
          tamanho="sm"
          onClick={aoCancelar}
          disabled={movendo}
          className="shrink-0"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
