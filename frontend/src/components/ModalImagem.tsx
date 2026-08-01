import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface Props {
  titulo: string;
  src: string;
  aoFechar: () => void;
  aoAlterar: () => void;
}

export function ModalImagem({ titulo, src, aoFechar, aoAlterar }: Props) {
  return (
    <Modal titulo={titulo} aoFechar={aoFechar}>
      <img src={src} alt={titulo} className="max-h-[60vh] w-full rounded-lg object-contain" />
      <Button variante="primary" className="mt-4 w-full" onClick={aoAlterar}>
        Alterar foto
      </Button>
    </Modal>
  );
}
