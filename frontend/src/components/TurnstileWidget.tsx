import { useEffect, useRef } from 'react';

// Sitekey de teste pública da própria Cloudflare (sempre aprova) — documentada
// em developers.cloudflare.com/turnstile/troubleshooting/testing/, não é um
// segredo nem uma chave inventada. Serve só pra rodar localmente antes de
// termos um site Turnstile real configurado (ver relatório da missão).
const SITEKEY_TESTE_CLOUDFLARE = '1x00000000000000000000AA';

interface RenderOpcoes {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, opcoes: RenderOpcoes) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface Props {
  onToken: (token: string | null) => void;
}

/** Widget do Cloudflare Turnstile — protege o formulário "Esqueci minha senha" contra automação/spam. */
export function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || SITEKEY_TESTE_CLOUDFLARE;

  useEffect(() => {
    let cancelado = false;
    let widgetId: string | null = null;

    function renderizar() {
      if (cancelado || !containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    }

    if (window.turnstile) {
      renderizar();
    } else {
      const scriptExistente = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (scriptExistente) {
        scriptExistente.addEventListener('load', renderizar);
      } else {
        const script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', renderizar);
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelado = true;
      onToken(null);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={containerRef} />;
}
