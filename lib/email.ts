const RESEND_API_URL = "https://api.resend.com/emails";

// Envia e-mail transacional via Resend (recuperação de senha, verificação
// de cadastro). Sem domínio verificado no Resend, o remetente padrão
// (onboarding@resend.dev) só entrega pro e-mail da própria conta Resend —
// pra funcionar com clientes de verdade, verifique um domínio lá e defina
// RESEND_FROM_EMAIL.
export async function enviarEmail(params: { to: string; subject: string; html: string }) {
  const chaveApi = process.env.RESEND_API_KEY;
  if (!chaveApi) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  const remetente = process.env.RESEND_FROM_EMAIL || "Verdog <onboarding@resend.dev>";

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chaveApi}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail via Resend: ${detalhe}`);
  }
}

function layoutEmail(titulo: string, corpoHtml: string) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: #2f6b3a; color: white; display: inline-block; padding: 8px 16px; border-radius: 999px; font-weight: bold; margin-bottom: 24px;">
        Verdog
      </div>
      <h1 style="font-size: 18px; margin: 0 0 12px;">${titulo}</h1>
      ${corpoHtml}
      <p style="font-size: 12px; color: #888; margin-top: 32px;">
        Se você não pediu isso, pode ignorar este e-mail.
      </p>
    </div>
  `;
}

export async function enviarEmailVerificacao(email: string, link: string) {
  await enviarEmail({
    to: email,
    subject: "Confirme seu e-mail — Verdog",
    html: layoutEmail(
      "Confirme seu e-mail",
      `
        <p style="font-size: 14px; color: #444; line-height: 1.5;">
          Clique no botão abaixo pra confirmar seu e-mail no Verdog.
        </p>
        <a href="${link}" style="display: inline-block; background: #2f6b3a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-top: 8px;">
          Confirmar e-mail
        </a>
      `
    ),
  });
}

export async function enviarEmailRedefinirSenha(email: string, link: string) {
  await enviarEmail({
    to: email,
    subject: "Redefinir senha — Verdog",
    html: layoutEmail(
      "Redefinir sua senha",
      `
        <p style="font-size: 14px; color: #444; line-height: 1.5;">
          Clique no botão abaixo pra escolher uma nova senha. Esse link vale por 1 hora.
        </p>
        <a href="${link}" style="display: inline-block; background: #2f6b3a; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-top: 8px;">
          Redefinir senha
        </a>
      `
    ),
  });
}
