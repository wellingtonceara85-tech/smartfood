import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { deveExibirNovidade, NOVIDADE_ATUAL } from '../../lib/novidades';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function ModalNovidades() {
  const { usuario } = useAuth();
  const [visivel, setVisivel] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    // Aviso é só pra dono de loja — Admin Master pode acabar em /painel
    // manualmente, mas nunca deve receber essa novidade de lojista.
    if (usuario?.papel !== 'dono_loja') return;

    let cancelado = false;
    api<{ versao: string | null }>('/api/admin/novidade-vista', { autenticado: true })
      .then((resposta) => {
        if (!cancelado && deveExibirNovidade(resposta.versao, NOVIDADE_ATUAL.versao)) {
          setVisivel(true);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [usuario?.papel]);

  async function confirmar() {
    setConfirmando(true);
    try {
      await api('/api/admin/novidade-vista', {
        method: 'PUT',
        autenticado: true,
        body: { versao: NOVIDADE_ATUAL.versao },
      });
    } catch {
      // Não bloqueia o usuário por causa disso — na pior hipótese o aviso
      // aparece de novo no próximo acesso, o que é só um pequeno incômodo.
    } finally {
      setConfirmando(false);
      setVisivel(false);
    }
  }

  if (!visivel) return null;

  return (
    <Modal titulo={NOVIDADE_ATUAL.titulo} aoFechar={confirmar}>
      <p className="text-sm text-gray-600">{NOVIDADE_ATUAL.texto}</p>

      <div className="mt-4 flex flex-col gap-3">
        {NOVIDADE_ATUAL.itens.map((item) => (
          <div key={item.titulo} className="flex gap-3">
            <span className="text-xl leading-none" aria-hidden="true">
              {item.icone}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.titulo}</p>
              <p className="text-sm text-gray-500">{item.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-600">{NOVIDADE_ATUAL.textoFinal}</p>
      <p className="mt-3 text-xs text-gray-400">{NOVIDADE_ATUAL.rodape}</p>

      <Button
        type="button"
        variante="primary"
        className="mt-4 w-full justify-center py-2.5"
        onClick={confirmar}
        disabled={confirmando}
      >
        {NOVIDADE_ATUAL.botao}
      </Button>
    </Modal>
  );
}
