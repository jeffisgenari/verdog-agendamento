import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { criarToken } from "@/lib/tokens";
import { enviarEmailRedefinirSenha } from "@/lib/email";

// POST /api/usuario/esqueci-senha — sempre responde "ok" (mesma resposta
// exista ou não a conta, e mesmo pra contas só-Google sem senha) pra não
// vazar quais e-mails têm conta no Verdog.
export async function POST(request: Request) {
  const { email } = await request.json();
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Informe seu e-mail." }, { status: 400 });
  }

  const emailNormalizado = email.trim().toLowerCase();

  const usuario = await prisma.user.findUnique({ where: { email: emailNormalizado } }).catch(() => null);

  if (usuario?.senhaHash) {
    const token = await criarToken(emailNormalizado, "REDEFINIR_SENHA");
    const link = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;
    await enviarEmailRedefinirSenha(emailNormalizado, link).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
