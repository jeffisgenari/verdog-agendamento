import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/notificacoes/marcar-lidas — marca todas as notificações do
// usuário logado como lidas (chamado ao abrir o sino).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  await prisma.notificacao.updateMany({
    where: { userId: session.user.id, lida: false },
    data: { lida: true },
  });

  return NextResponse.json({ ok: true });
}
