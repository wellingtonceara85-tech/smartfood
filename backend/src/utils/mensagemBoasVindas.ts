export const CAMINHO_GUIA_WHATSAPP = '/ajuda/whatsapp-business';

interface DadosBoasVindas {
  donoNome: string;
  lojaNome: string;
  linkAtivacao: string;
  linkCardapio: string;
  linkGuiaWhatsapp: string;
}

/**
 * Monta a mensagem de boas-vindas pronta pra copiar e enviar ao lojista pelo
 * WhatsApp — mesmo modelo de texto pedido na missão do Admin Master, só com
 * os placeholders preenchidos. Nada aqui deve exigir edição manual antes do
 * envio.
 *
 * *texto* é a sintaxe de negrito do WhatsApp (não é markdown/HTML) — os
 * asteriscos precisam ir para a área de transferência junto com o texto, é
 * o próprio WhatsApp quem interpreta na hora de colar/enviar. Os links
 * ficam sempre sem formatação, pra não quebrar clique/cópia.
 */
export function montarMensagemBoasVindas(dados: DadosBoasVindas): string {
  return [
    `Olá, *${dados.donoNome}*!`,
    '',
    `Segue o acesso da *${dados.lojaNome}* para você começar a utilizar o *SmartFood*, além de algumas orientações importantes.`,
    '',
    '🔐 *1. Ativação da sua conta*',
    'Use primeiro este link para criar sua senha e acessar o painel de gerenciamento da loja.',
    '⚠️ O link expira em *7 dias* e pode ser utilizado *apenas uma vez*.',
    dados.linkAtivacao,
    '',
    '🛒 *2. Cardápio público*',
    'Este é o link que poderá ser enviado aos seus *clientes* para acessarem o cardápio e realizarem os pedidos:',
    dados.linkCardapio,
    '',
    '📸 *Cadastro dos produtos*',
    'No painel você poderá cadastrar *nome, descrição, preço, foto e demais informações* dos produtos.',
    'As fotos são importantes porque serão exibidas diretamente no cardápio. Procure utilizar fotos *claras, bem enquadradas e que valorizem o produto*.',
    'Se tiver dificuldade no cadastro, principalmente com as fotos, *pode me chamar que eu te ajudo*.',
    '',
    '📱 *WhatsApp Business*',
    'Preparamos também um guia rápido mostrando como configurar o WhatsApp Business para direcionar seus clientes automaticamente ao cardápio SmartFood:',
    dados.linkGuiaWhatsapp,
    '',
    'Pode começar utilizando normalmente. Se encontrar alguma dificuldade ou tiver alguma sugestão, *me avise*. Esse retorno vai nos ajudar a melhorar ainda mais o SmartFood. 😊',
  ].join('\n');
}
