/**
 * Missão 0006, Seção 9. Todo o enum é aceito desde a criação (Missão 0012, Seção 2, revisão) —
 * só validação de valor, sem custo, evita migration quando Totem/QR Code existirem de verdade.
 * Só Usuário interno cria Pedido nesta missão, então na prática só MESA/BALCAO/AUTOATENDIMENTO
 * fazem sentido agora — os demais ficam validados e prontos para quando Vitrine/Cliente existirem.
 */
export enum CanalVenda {
  SITE = 'SITE',
  QR_CODE = 'QR_CODE',
  MESA = 'MESA',
  BALCAO = 'BALCAO',
  AUTOATENDIMENTO = 'AUTOATENDIMENTO',
  MARKETPLACE = 'MARKETPLACE',
  API = 'API',
}

const CANAIS_VENDA: readonly CanalVenda[] = Object.values(CanalVenda);

export function ehCanalVendaValido(valor: string): valor is CanalVenda {
  return (CANAIS_VENDA as string[]).includes(valor);
}
