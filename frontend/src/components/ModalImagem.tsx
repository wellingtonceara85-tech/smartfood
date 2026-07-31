interface Props {
  titulo: string;
  src: string;
  aoFechar: () => void;
  aoAlterar: () => void;
}

export function ModalImagem({ titulo, src, aoFechar, aoAlterar }: Props) {
  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="fixed inset-0 z-40 bg-black/60"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-gray-800">{titulo}</span>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="rounded-full p-1 text-xl leading-none text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <img src={src} alt={titulo} className="max-h-[60vh] w-full rounded-lg object-contain" />

          <button
            type="button"
            onClick={aoAlterar}
            className="mt-4 w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
          >
            Alterar foto
          </button>
        </div>
      </div>
    </>
  );
}
