import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarToken } from "@/lib/tokens";
import { enviarEmailVerificacao } from "@/lib/email";
import { RateLimit } from "@/lib/ratelimit";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (await RateLimit.reenviarVerificacao(session.user.id)) {
    return NextResponse.json(
      { error: "Muitos pedidos. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const usuario = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!usuario) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }
  if (usuario.emailVerified) {
    return NextResponse.json({ error: "Esse e-mail já está verificado." }, { status: 400 });
  }

  const token = await criarToken(usuario.email, "VERIFICACAO_EMAIL");
  const link = `${process.env.NEXTAUTH_URL}/verificar-email?token=${token}`;

  try {
    await enviarEmailVerificacao(usuario.email, link);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
