import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { rotuloProdutoIncompleto } from '../../lib/produto';
import { Produto } from '../../types';

interface Props {
  produto: Produto;
  selecionado: boolean;
  aoAlternarSelecao: () => void;
  aoAlternarDisponibilidade: () => void;
  aoEditar: () => void;
  aoDuplicar: () => void;
  aoExcluir: () => void;
  duplicando: boolean;
  destacado: boolean;
}

export function ProdutoLinha({
  produto,
  selecionado,
  aoAlternarSelecao,
  aoAlternarDisponibilidade,
  aoEditar,
  aoDuplicar,
  aoExcluir,
  duplicando,
  destacado,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: produto.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const incompleto = rotuloProdutoIncompleto(produto);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 rounded-card border bg-white p-2.5 shadow-card transition-shadow sm:flex-row sm:items-center sm:gap-3 ${
        isDragging
          ? 'z-10 border-primary opacity-70 shadow-card-hover'
          : destacado
            ? 'border-primary ring-2 ring-primary'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={selecionado}
          onChange={aoAlternarSelecao}
          aria-label={`Selecionar ${produto.nome}`}
          className="h-5 w-5 shrink-0 accent-primary"
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar para reordenar ${produto.nome}`}
          title="Arraste para reordenar"
          className="flex h-11 w-8 shrink-0 touch-none cursor-grab items-center justify-center rounded text-lg leading-none text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
        >
          ⠿
        </button>

        <div
          className={`flex min-w-0 flex-1 items-center gap-3 ${produto.disponivel ? '' : 'opacity-50'}`}
        >
          {produto.fotoUrl ? (
            <img
              src={produto.fotoUrl}
              alt={produto.nome}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-100" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-800">{produto.nome}</p>
            <p className="text-sm text-gray-500">R$ {produto.preco.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pl-[68px] sm:flex-nowrap sm:justify-end sm:gap-2 sm:pl-0">
        <Badge cor={produto.disponivel ? 'primary' : 'gray'}>
          {produto.disponivel ? 'Disponível' : 'Indisponível'}
        </Badge>
        {incompleto && <Badge cor="yellow">{incompleto}</Badge>}

        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={produto.disponivel}
            onChange={aoAlternarDisponibilidade}
            className="h-4 w-4 accent-primary"
          />
          <span className="hidden sm:inline">Disponível</span>
        </label>
        <Button variante="ghost" tamanho="sm" onClick={aoEditar}>
          Editar
        </Button>
        <Button variante="ghost" tamanho="sm" onClick={aoDuplicar} disabled={duplicando}>
          {duplicando ? 'Duplicando...' : 'Duplicar'}
        </Button>
        <Button variante="ghost-danger" tamanho="sm" onClick={aoExcluir}>
          Excluir
        </Button>
      </div>
    </div>
  );
}
