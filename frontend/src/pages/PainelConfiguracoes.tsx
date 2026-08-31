import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useNotificacoes } from '../context/NotificacoesContext';
import {
  CATALOGO_SONS,
  DURACAO_ALERTA_MAX_S,
  DURACAO_ALERTA_MIN_S,
  INTERVALO_REPETICAO_MAX_S,
  INTERVALO_REPETICAO_MIN_S,
  lerDuracaoAlerta,
  lerIntervaloRepeticao,
  lerRepeticaoAtiva,
  lerSomEscolhido,
  salvarDuracaoAlerta,
  salvarIntervaloRepeticao,
  salvarRepeticaoAtiva,
  salvarSomEscolhido,
  SomId,
  tocarAlertaSonoro,
} from '../lib/somPedido';

const LABEL = 'text-sm font-medium text-gray-700';

export function PainelConfiguracoes() {
  const { somAtivado, alternarSom } = useNotificacoes();
  const [somEscolhido, setSomEscolhido] = useState<SomId>(lerSomEscolhido);
  const [duracao, setDuracao] = useState(lerDuracaoAlerta);
  const [repeticaoAtiva, setRepeticaoAtiva] = useState(lerRepeticaoAtiva);
  const [intervalo, setIntervalo] = useState(lerIntervaloRepeticao);

  function escolherSom(somId: SomId) {
    setSomEscolhido(somId);
    salvarSomEscolhido(somId);
  }

  function testarSom() {
    tocarAlertaSonoro(somEscolhido, Math.min(duracao, 5));
  }

  function ajustarDuracao(valor: number) {
    setDuracao(valor);
    salvarDuracaoAlerta(valor);
  }

  function alternarRepeticao() {
    setRepeticaoAtiva((atual) => {
      const novo = !atual;
      salvarRepeticaoAtiva(novo);
      return novo;
    });
  }

  function ajustarIntervalo(valor: number) {
    setIntervalo(valor);
    salvarIntervaloRepeticao(valor);
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Configurações</h2>
        <p className="text-sm text-gray-500">
          Preferências de alerta sonoro pra novos pedidos — salvas neste aparelho.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-2">
          <span className={LABEL}>
            {somAtivado ? '🔊 Som de novos pedidos' : '🔇 Som desativado'}
          </span>
          <input
            type="checkbox"
            checked={somAtivado}
            onChange={alternarSom}
            aria-label="Ativar som de novos pedidos"
            className="h-4 w-4 accent-primary"
          />
        </label>

        <div>
          <p className={LABEL}>Som de novo pedido</p>
          <div className="mt-2 flex flex-col gap-2">
            {CATALOGO_SONS.map((som) => (
              <label
                key={som.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  somEscolhido === som.id
                    ? 'border-primary bg-primary-light text-primary-hover'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="som-pedido"
                  checked={somEscolhido === som.id}
                  onChange={() => escolherSom(som.id)}
                  className="h-4 w-4 accent-primary"
                />
                {som.nome}
              </label>
            ))}
          </div>
          <Button
            type="button"
            variante="secondary"
            tamanho="sm"
            className="mt-3"
            onClick={testarSom}
          >
            ▶ Testar som
          </Button>
        </div>

        <div>
          <label className={LABEL} htmlFor="duracao-alerta">
            Duração do alerta: {duracao} segundos
          </label>
          <input
            id="duracao-alerta"
            type="range"
            min={DURACAO_ALERTA_MIN_S}
            max={DURACAO_ALERTA_MAX_S}
            value={duracao}
            onChange={(e) => ajustarDuracao(Number(e.target.value))}
            className="mt-1 w-full accent-primary"
          />
          <p className="text-xs text-gray-400">
            Entre {DURACAO_ALERTA_MIN_S}s e {DURACAO_ALERTA_MAX_S}s — quanto tempo o som toca a cada
            disparo.
          </p>
        </div>

        <div>
          <label className="flex items-center justify-between gap-2">
            <span className={LABEL}>
              Repetir alerta enquanto houver pedido novo sem atendimento
            </span>
            <input
              type="checkbox"
              checked={repeticaoAtiva}
              onChange={alternarRepeticao}
              aria-label="Repetir alerta enquanto houver pedido pendente"
              className="h-4 w-4 accent-primary"
            />
          </label>

          {repeticaoAtiva && (
            <div className="mt-3">
              <label className={LABEL} htmlFor="intervalo-repeticao">
                Repetir a cada:{' '}
                {Math.round(intervalo / 60) >= 1 && intervalo % 60 === 0
                  ? `${intervalo / 60} min`
                  : `${intervalo}s`}
              </label>
              <input
                id="intervalo-repeticao"
                type="range"
                min={INTERVALO_REPETICAO_MIN_S}
                max={INTERVALO_REPETICAO_MAX_S}
                step={10}
                value={intervalo}
                onChange={(e) => ajustarIntervalo(Number(e.target.value))}
                className="mt-1 w-full accent-primary"
              />
              <p className="text-xs text-gray-400">
                Entre {INTERVALO_REPETICAO_MIN_S}s e {Math.round(INTERVALO_REPETICAO_MAX_S / 60)}{' '}
                min — pra nunca criar um loop de som descontrolado.
              </p>
            </div>
          )}
        </div>
      </Card>

      <p className="text-xs text-gray-400">
        O alerta soa enquanto o painel estiver aberto neste aparelho. Com o app em segundo plano
        (aba aberta) e notificações do navegador ativadas, você também recebe um aviso do sistema —
        com o app totalmente fechado ainda não há garantia de alerta.
      </p>

      <Link to="/painel/sugestoes">
        <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-gray-50">
          <span>
            <span className="block text-sm font-medium text-gray-800">
              💡 Tem alguma ideia para melhorar o SmartFood?
            </span>
            <span className="block text-xs text-gray-500">Envie sua sugestão pra nossa equipe</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-primary">Enviar →</span>
        </Card>
      </Link>
    </div>
  );
}
