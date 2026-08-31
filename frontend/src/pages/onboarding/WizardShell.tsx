import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  titulo: string;
  descricao?: string;
  etapaAtual: number;
  totalEtapas: number;
  aoVoltar?: () => void;
  children: ReactNode;
}

/**
 * Casca visual comum a todo passo do wizard — cabeçalho com "Etapa X de Y" e
 * "Sair e continuar depois" (o progresso já está salvo no backend a cada
 * passo, então sair aqui nunca perde nada — ver OnboardingWizard).
 */
export function WizardShell({
  titulo,
  descricao,
  etapaAtual,
  totalEtapas,
  aoVoltar,
  children,
}: Props) {
  const { logout } = useAuth();
  const progresso = Math.round((etapaAtual / totalEtapas) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-text"
            >
              S
            </span>
            <p className="text-sm font-bold text-gray-800">SmartFood</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700"
          >
            Sair e continuar depois
          </button>
        </div>
        <div className="mx-auto mt-3 max-w-md">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Etapa {etapaAtual} de {totalEtapas}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-16">
        {aoVoltar && (
          <button
            type="button"
            onClick={aoVoltar}
            className="mb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Voltar
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-800">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-gray-500">{descricao}</p>}
        <div className="mt-5">{children}</div>
      </main>
    </div>
  );
}
