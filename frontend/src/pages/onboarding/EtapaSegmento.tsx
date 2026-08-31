import { SegmentoOpcao } from '../../types';
import { Card } from '../../components/ui/Card';

interface Props {
  segmentos: SegmentoOpcao[];
  segmentoAtual: string | null;
  aoEscolher: (segmento: string) => void;
}

export function EtapaSegmento({ segmentos, segmentoAtual, aoEscolher }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {segmentos.map((segmento) => (
        <button key={segmento.chave} type="button" onClick={() => aoEscolher(segmento.chave)}>
          <Card
            className={`flex h-full items-center justify-center text-center text-sm font-medium transition-colors ${
              segmentoAtual === segmento.chave
                ? 'border-primary bg-primary-light text-primary-hover'
                : 'text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {segmento.rotulo}
          </Card>
        </button>
      ))}
    </div>
  );
}
