import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Categoria } from '../../types';

interface ItemProps {
  categoria: Categoria;
  editando: boolean;
  nomeEditando: string;
  aoIniciarEdicao: () => void;
  aoMudarNome: (nome: string) => void;
  aoSalvar: () => void;
  aoCancelar: () => void;
  aoExcluir: () => void;
}

function ItemCategoria({
  categoria,
  editando,
  nomeEditando,
  aoIniciarEdicao,
  aoMudarNome,
  aoSalvar,
  aoCancelar,
  aoExcluir,
}: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: categoria.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-lg border bg-white px-2 py-1.5 transition-shadow ${
        isDragging ? 'z-10 border-primary opacity-70 shadow-card-hover' : 'border-gray-200'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar para reordenar ${categoria.nome}`}
        title="Arraste para reordenar"
        className="flex h-11 w-9 shrink-0 touch-none cursor-grab items-center justify-center rounded text-lg leading-none text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
      >
        ⠿
      </button>

      {editando ? (
        <>
          <input
            autoFocus
            value={nomeEditando}
            onChange={(e) => aoMudarNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aoSalvar()}
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={aoSalvar}
            className="shrink-0 px-2 py-1.5 text-xs font-semibold text-primary-hover hover:underline"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={aoCancelar}
            className="shrink-0 px-2 py-1.5 text-xs font-medium text-gray-500 hover:underline"
          >
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
            {categoria.nome}
          </span>
          <button
            type="button"
            onClick={aoIniciarEdicao}
            aria-label={`Editar categoria ${categoria.nome}`}
            title="Editar categoria"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-secondary"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={aoExcluir}
            aria-label={`Excluir categoria ${categoria.nome}`}
            title="Excluir categoria"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            ×
          </button>
        </>
      )}
    </li>
  );
}

interface Props {
  categorias: Categoria[];
  aoReordenar: (novaOrdem: Categoria[]) => void;
  categoriaEditandoId: string | null;
  nomeCategoriaEditando: string;
  aoIniciarEdicao: (categoria: Categoria) => void;
  aoMudarNomeEdicao: (nome: string) => void;
  aoSalvarEdicao: (id: string) => void;
  aoCancelarEdicao: () => void;
  aoExcluir: (id: string) => void;
}

/**
 * Sensores separados por tipo de ponteiro de propósito: o mouse ativa o
 * arrasto a partir de 8px de movimento (padrão dnd-kit), mas no toque isso
 * competiria com a rolagem da página a cada leve deslize. O TouchSensor com
 * `delay` exige um "press and hold" de 200ms antes de iniciar o arrasto —
 * um toque rápido continua rolando a página normalmente, só o gesto de
 * segurar é interpretado como "quero arrastar".
 */
export function CategoriasArrastaveis({
  categorias,
  aoReordenar,
  categoriaEditandoId,
  nomeCategoriaEditando,
  aoIniciarEdicao,
  aoMudarNomeEdicao,
  aoSalvarEdicao,
  aoCancelarEdicao,
  aoExcluir,
}: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function aoFinalizarArrasto(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;
    const indiceAntigo = categorias.findIndex((c) => c.id === active.id);
    const indiceNovo = categorias.findIndex((c) => c.id === over.id);
    if (indiceAntigo === -1 || indiceNovo === -1) return;
    aoReordenar(arrayMove(categorias, indiceAntigo, indiceNovo));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={aoFinalizarArrasto}>
      <SortableContext items={categorias.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-1.5">
          {categorias.map((categoria) => (
            <ItemCategoria
              key={categoria.id}
              categoria={categoria}
              editando={categoriaEditandoId === categoria.id}
              nomeEditando={nomeCategoriaEditando}
              aoIniciarEdicao={() => aoIniciarEdicao(categoria)}
              aoMudarNome={aoMudarNomeEdicao}
              aoSalvar={() => aoSalvarEdicao(categoria.id)}
              aoCancelar={aoCancelarEdicao}
              aoExcluir={() => aoExcluir(categoria.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
