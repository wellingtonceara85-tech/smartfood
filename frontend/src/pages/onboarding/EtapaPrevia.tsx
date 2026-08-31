import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Props {
  slug: string;
  aoContinuar: () => void;
}

export function EtapaPrevia({ slug, aoContinuar }: Props) {
  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Assim é como o seu cardápio já aparece pros clientes agora — confira antes de seguir.
      </p>
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary-light px-4 py-3 text-sm font-semibold text-primary-hover transition-colors hover:opacity-90"
      >
        Ver prévia do meu cardápio →
      </a>
      <Button type="button" onClick={aoContinuar}>
        Continuar
      </Button>
    </Card>
  );
}
