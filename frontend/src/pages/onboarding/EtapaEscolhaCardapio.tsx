import { Card } from '../../components/ui/Card';
import { MetodoCardapio } from '../../types';

interface Opcao {
  metodo: MetodoCardapio;
  titulo: string;
  descricao: string;
  icone: string;
}

const OPCOES: Opcao[] = [
  {
    metodo: 'planilha',
    titulo: 'Importar planilha',
    descricao: 'Envie um arquivo .xlsx ou .csv com seu cardápio',
    icone: '📄',
  },
  {
    metodo: 'colar_texto',
    titulo: 'Colar lista de produtos',
    descricao: 'Cole um texto do WhatsApp, bloco de notas ou rede social',
    icone: '📋',
  },
  {
    metodo: 'arquivo',
    titulo: 'Enviar cardápio em arquivo',
    descricao: 'PDF, JPG ou PNG — nossa equipe revisa e implanta pra você',
    icone: '🖼️',
  },
  {
    metodo: 'guiado',
    titulo: 'Montar com ajuda do SmartFood',
    descricao: 'Sugerimos categorias com base no que você vende',
    icone: '✨',
  },
  {
    metodo: 'manual',
    titulo: 'Cadastrar manualmente',
    descricao: 'Ir direto pro cadastro de categorias e produtos',
    icone: '✍️',
  },
];

interface Props {
  aoEscolher: (metodo: MetodoCardapio) => void;
}

export function EtapaEscolhaCardapio({ aoEscolher }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {OPCOES.map((opcao) => (
        <button key={opcao.metodo} type="button" onClick={() => aoEscolher(opcao.metodo)}>
          <Card className="flex items-center gap-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50">
            <span aria-hidden="true" className="text-2xl">
              {opcao.icone}
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-800">{opcao.titulo}</span>
              <span className="block text-xs text-gray-500">{opcao.descricao}</span>
            </span>
          </Card>
        </button>
      ))}

      <Card className="flex items-center gap-3 opacity-60">
        <span aria-hidden="true" className="text-2xl">
          🛵
        </span>
        <span>
          <span className="block text-sm font-semibold text-gray-800">Já vende no iFood?</span>
          <span className="block text-xs text-gray-500">Em breve — importação automática</span>
        </span>
      </Card>
    </div>
  );
}
