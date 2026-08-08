import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarToken } from "@/lib/tokens";
import { enviarEmailRedefinirSenha } from "@/lib/email";
import { RateLimit } from "@/lib/ratelimit";

// POST /api/usuario/esqueci-senha — sempre responde "ok" (mesma resposta
// exista ou não a conta, e mesmo pra contas só-Google sem senha) pra não
// vazar quais e-mails têm conta no Verdog.
export async function POST(request: Request) {
  const { email } = await request.json();
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Informe seu e-mail." }, { status: 400 });
  }

  const emailNormalizado = email.trim().toLowerCase();

  // Por e-mail alvo, não por IP — sem isso, dava pra encher a caixa de
  // entrada de qualquer pessoa de pedidos de redefinição de senha.
  if (await RateLimit.esqueciSenha(emailNormalizado)) {
    return NextResponse.json(
      { error: "Muitos pedidos pra esse e-mail. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const usuario = await prisma.user.findUnique({ where: { email: emailNormalizado } }).catch(() => null);

  if (usuario?.senhaHash) {
    const token = await criarToken(emailNormalizado, "REDEFINIR_SENHA");
    const link = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;
    await enviarEmailRedefinirSenha(emailNormalizado, link).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
