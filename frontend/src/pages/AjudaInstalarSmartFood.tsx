import { Card } from '../components/ui/Card';

const PASSOS_IPHONE = [
  {
    numero: 1,
    titulo: 'Abra o SmartFood no Safari',
    descricao: 'A instalação só funciona pelo navegador Safari — não funciona no Chrome do iPhone.',
  },
  {
    numero: 2,
    titulo: 'Toque no ícone de Compartilhar',
    descricao: 'É o quadrado com uma seta para cima, na barra inferior (ou superior, em iPads).',
  },
  {
    numero: 3,
    titulo: 'Escolha "Adicionar à Tela de Início"',
    descricao: 'Role a lista de opções até encontrar esse item.',
  },
  {
    numero: 4,
    titulo: 'Toque em "Adicionar"',
    descricao: 'Confirme no canto superior direito. O ícone do SmartFood aparece na tela inicial.',
  },
];

const PASSOS_ANDROID = [
  {
    numero: 1,
    titulo: 'Abra o SmartFood no Chrome',
    descricao: 'Acesse o link normalmente pelo navegador Chrome do celular.',
  },
  {
    numero: 2,
    titulo: 'Toque no menu de três pontos',
    descricao: 'Fica no canto superior direito da tela.',
  },
  {
    numero: 3,
    titulo: 'Escolha "Adicionar à tela inicial"',
    descricao:
      'Em alguns aparelhos o Chrome pode mostrar "Instalar app" em vez disso — se aparecer essa opção, também funciona.',
  },
  {
    numero: 4,
    titulo: 'Confirme',
    descricao: 'Toque em "Adicionar". O ícone do SmartFood aparece na tela inicial.',
  },
];

function Selo({ children }: { children: string }) {
  return <span aria-hidden="true">{children}</span>;
}

function BlocoDestaque({
  icone,
  titulo,
  cor,
  children,
}: {
  icone: string;
  titulo: string;
  cor: 'verde' | 'cinza' | 'amarelo';
  children: React.ReactNode;
}) {
  const estilos = {
    verde: 'border-primary/20 bg-primary-light',
    cinza: 'border-gray-200 bg-gray-50',
    amarelo: 'border-yellow-200 bg-yellow-50',
  }[cor];
  return (
    <div className={`rounded-lg border p-4 ${estilos}`}>
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-gray-800">
        <Selo>{icone}</Selo> {titulo}
      </p>
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}

function PassoNumerado({
  numero,
  titulo,
  descricao,
}: {
  numero: number;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-text">
        {numero}
      </span>
      <div>
        <p className="font-medium text-gray-800">{titulo}</p>
        <p className="text-sm text-gray-500">{descricao}</p>
      </div>
    </div>
  );
}

export function AjudaInstalarSmartFood() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-text"
          >
            S
          </span>
          <p className="text-sm font-bold text-gray-800">
            Smart<span className="text-primary">Food</span>{' '}
            <span className="font-normal text-gray-400">· Guia rápido</span>
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Adicione o SmartFood à tela inicial</h1>
          <p className="mt-1 text-gray-500">
            Deixe o SmartFood a um toque de distância, como se fosse um aplicativo instalado.
          </p>
        </div>

        <BlocoDestaque icone="✓" titulo="O que isso faz" cor="verde">
          Cria um atalho na tela inicial do celular que abre o SmartFood direto, sem precisar
          digitar o endereço no navegador toda vez.
        </BlocoDestaque>

        <BlocoDestaque icone="◷" titulo="Quanto tempo leva" cor="cinza">
          Menos de 1 minuto. É só seguir o passo a passo do seu aparelho abaixo.
        </BlocoDestaque>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">📱 iPhone / iPad</h2>
          <p className="mb-3 text-sm text-gray-500">Use o navegador Safari.</p>
          <div className="flex flex-col gap-2">
            {PASSOS_IPHONE.map((passo) => (
              <PassoNumerado key={passo.numero} {...passo} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">🤖 Android</h2>
          <p className="mb-3 text-sm text-gray-500">Use o navegador Chrome.</p>
          <div className="flex flex-col gap-2">
            {PASSOS_ANDROID.map((passo) => (
              <PassoNumerado key={passo.numero} {...passo} />
            ))}
          </div>
        </Card>

        <BlocoDestaque icone="?" titulo="Precisou de ajuda?" cor="amarelo">
          Se os nomes dos menus estiverem diferentes do descrito aqui, pode variar conforme a versão
          do aparelho — a sequência geral (Compartilhar/Menu → Adicionar à tela inicial) é a mesma.
        </BlocoDestaque>
      </main>
    </div>
  );
}
