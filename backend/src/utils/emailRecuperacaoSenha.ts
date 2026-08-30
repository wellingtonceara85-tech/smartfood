import { Resend } from 'resend';
import { COR_PRIMARIA_PADRAO } from './cor';
import { env } from '../env';

export interface EmailRecuperacaoSenha {
  assunto: string;
  html: string;
  texto: string;
}

interface DadosEmailRecuperacao {
  nome: string;
  link: string;
}

/**
 * Monta o conteúdo do e-mail (função pura, sem I/O — testável sem bater em
 * nenhum serviço externo). Nunca inclui senha, hash ou qualquer dado
 * sensível — só o link de uso único e o aviso de expiração.
 */
export function montarEmailRecuperacaoSenha({
  nome,
  link,
}: DadosEmailRecuperacao): EmailRecuperacaoSenha {
  const assunto = 'Redefina sua senha do SmartFood';

  const texto = [
    `Olá, ${nome}.`,
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta no SmartFood.',
    '',
    `Para criar uma nova senha, acesse: ${link}`,
    '',
    'Este link expira em 1 hora e só pode ser usado uma vez.',
    '',
    'Se você não solicitou essa alteração, pode ignorar este e-mail — sua senha atual continua válida.',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${COR_PRIMARIA_PADRAO};padding:20px 24px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">SmartFood</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2937;font-size:14px;line-height:1.6;">
                <p>Olá, ${escaparHtml(nome)}.</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no SmartFood.</p>
                <p style="text-align:center;margin:28px 0;">
                  <a href="${link}" style="background-color:${COR_PRIMARIA_PADRAO};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Redefinir minha senha</a>
                </p>
                <p style="color:#6b7280;font-size:13px;">Este link expira em <strong>1 hora</strong> e só pode ser usado <strong>uma vez</strong>.</p>
                <p style="color:#6b7280;font-size:13px;">Se você não solicitou essa alteração, pode ignorar este e-mail — sua senha atual continua válida.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { assunto, html, texto };
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface DadosEnvioRecuperacao {
  para: string;
  nome: string;
  link: string;
}

/**
 * Único ponto que fala com o Resend. Se `RESEND_API_KEY`/`RESEND_FROM_EMAIL`
 * não estiverem configurados (ainda não autorizado/local sem secrets), cai
 * num fallback que nunca expõe o link/token em produção — só loga em dev,
 * pra dar pra testar o fluxo local sem depender de e-mail de verdade.
 */
export async function enviarEmailRecuperacaoSenha({
  para,
  nome,
  link,
}: DadosEnvioRecuperacao): Promise<void> {
  const { assunto, html, texto } = montarEmailRecuperacaoSenha({ nome, link });

  if (!env.resendApiKey || !env.resendFromEmail) {
    if (env.nodeEnv === 'production') {
      console.warn(
        `[recuperacao-senha] Resend não configurado (RESEND_API_KEY/RESEND_FROM_EMAIL ausentes) — e-mail para ${para} não foi enviado`,
      );
      return;
    }
    console.log(
      `[recuperacao-senha] (dev, Resend não configurado) Olá ${nome}, seu link de recuperação: ${link}`,
    );
    return;
  }

  const resend = new Resend(env.resendApiKey);
  const resultado = await resend.emails.send({
    from: env.resendFromEmail,
    to: para,
    subject: assunto,
    html,
    text: texto,
  });

  if (resultado.error) {
    // Nunca loga a API key nem o corpo do e-mail (teria o link/token) — só o
    // que o Resend devolveu sobre a falha do envio em si.
    console.error('[recuperacao-senha] Resend recusou o envio:', resultado.error.message);
  }
}
