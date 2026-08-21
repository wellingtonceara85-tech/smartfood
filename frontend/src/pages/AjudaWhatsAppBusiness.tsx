import { Card } from '../components/ui/Card';

const PASSOS_CONFIGURACAO = [
  {
    numero: 1,
    titulo: 'Abra o WhatsApp Business',
    descricao: 'Entre no aplicativo usado pela loja para falar com os clientes.',
  },
  {
    numero: 2,
    titulo: 'Procure "Ferramentas comerciais"',
    descricao:
      'No Android, geralmente fica no menu de três pontos. No iPhone, procure em Ferramentas ou Configurações.',
  },
  {
    numero: 3,
    titulo: 'Abra "Mensagem de saudação"',
    descricao:
      'É a opção usada para receber automaticamente novos contatos ou clientes após um período sem conversa, conforme a configuração do aplicativo.',
  },
  {
    numero: 4,
    titulo: 'Ative e edite a mensagem',
    descricao:
      'Ative Enviar mensagem de saudação, abra o texto para edição e cole a mensagem que você deixou pronta.',
  },
  {
    numero: 5,
    titulo: 'Troque nome e link, depois salve',
    descricao:
      'Confira o nome da loja e cole o link público correto do SmartFood. Revise tudo antes de tocar em Salvar.',
  },
];

const PASSOS_TESTE = [
  {
    numero: 1,
    titulo: 'Chame a loja usando outro número',
    descricao: 'Envie um "Olá" para o WhatsApp Business da loja.',
  },
  {
    numero: 2,
    titulo: 'Leia a saudação como se fosse cliente',
    descricao:
      'Veja se o texto está natural, se o nome da loja está correto e se o link aparece com clareza.',
  },
  {
    numero: 3,
    titulo: 'Toque no link',
    descricao: 'Confirme se ele abre exatamente o cardápio público da sua loja no SmartFood.',
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

export function AjudaWhatsAppBusiness() {
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
          <h1 className="text-2xl font-bold text-gray-800">WhatsApp Business + SmartFood</h1>
          <p className="mt-1 text-gray-500">
            Um ajuste simples para levar o cliente direto ao seu cardápio.
          </p>
        </div>

        <BlocoDestaque icone="✓" titulo="O que vamos configurar" cor="verde">
          Quando alguém chamar a loja no WhatsApp, a mensagem de saudação pode apresentar o cardápio
          SmartFood logo no primeiro contato.
        </BlocoDestaque>

        <BlocoDestaque icone="◷" titulo="Quanto tempo leva" cor="cinza">
          Normalmente, de 3 a 5 minutos. Depois, vale fazer um teste com outro telefone antes de
          divulgar.
        </BlocoDestaque>

        <BlocoDestaque icone="→" titulo="Antes de abrir o aplicativo" cor="amarelo">
          Separe o link público do cardápio da sua loja (você recebeu esse link junto com o acesso
          ao SmartFood). É esse endereço que será colocado na mensagem automática.
        </BlocoDestaque>

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            Deixe a mensagem pronta primeiro
          </h2>
          <p className="mb-3 text-sm text-gray-500">
            Assim, na hora da configuração, você só precisa copiar, colar e conferir o link.
          </p>
          <p className="mb-1 text-sm font-medium text-gray-700">Tenha em mãos</p>
          <ul className="mb-3 list-inside list-disc text-sm text-gray-600">
            <li>WhatsApp Business da loja</li>
            <li>Link público do cardápio SmartFood</li>
            <li>Nome da loja exatamente como aparece para os clientes</li>
          </ul>
          <div className="rounded-lg border border-primary/30 bg-primary-light p-3 text-sm text-gray-700">
            <p className="mb-2 font-medium text-gray-800">Mensagem sugerida</p>
            <p>Olá! Seja bem-vindo(a) à [NOME DA LOJA]! 👋</p>
            <p className="mt-2">
              Para fazer seu pedido de forma rápida e prática, acesse nosso cardápio digital:
            </p>
            <p className="mt-2 font-medium">[COLE AQUI O LINK DA LOJA NO SMARTFOOD]</p>
            <p className="mt-2">
              Escolha seus produtos, informe os dados de entrega e finalize o pedido. Se precisar de
              ajuda, é só falar com a gente por aqui! 😊
            </p>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Dica —</span> se a loja já tem um jeito
            próprio de falar com os clientes, mantenha esse tom. O importante é deixar o link fácil
            de encontrar e a mensagem sem excesso de informação.
          </p>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">Agora configure no WhatsApp</h2>
          <p className="mb-3 text-sm text-gray-500">
            Siga a sequência abaixo. Os nomes podem variar levemente conforme o aparelho.
          </p>
          <div className="flex flex-col gap-2">
            {PASSOS_CONFIGURACAO.map((passo) => (
              <PassoNumerado key={passo.numero} {...passo} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-gray-800">
            Faça um teste antes de divulgar
          </h2>
          <p className="mb-3 text-sm text-gray-500">
            Esse último minuto evita mandar cliente para o link errado ou deixar uma mensagem antiga
            ativa.
          </p>
          <div className="flex flex-col gap-2">
            {PASSOS_TESTE.map((passo) => (
              <PassoNumerado key={passo.numero} {...passo} />
            ))}
          </div>
        </Card>

        <BlocoDestaque icone="✓" titulo="Se estiver tudo certo" cor="verde">
          Pronto. O WhatsApp já pode ajudar a direcionar os clientes para o cardápio digital.
        </BlocoDestaque>

        <BlocoDestaque icone="+" titulo="Fora do horário" cor="cinza">
          Também vale configurar a Mensagem de ausência do WhatsApp Business para orientar quem
          chamar quando a loja estiver fechada.
        </BlocoDestaque>

        <BlocoDestaque icone="?" titulo="Precisou de ajuda?" cor="amarelo">
          Se travar em algum passo ou tiver dúvida sobre qual link usar, pode chamar quem te deu
          acesso ao SmartFood — a gente ajuda na configuração inicial.
        </BlocoDestaque>

        <p className="pb-4 text-center font-semibold text-primary">Boas vendas!</p>
      </main>
    </div>
  );
}
