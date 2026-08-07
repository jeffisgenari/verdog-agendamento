import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notificacoes — últimas notificações do usuário logado, mais
// recentes primeiro.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const notificacoes = await prisma.notificacao.findMany({
    where: { userId: session.user.id },
    orderBy: { criadoEm: "desc" },
    take: 20,
  });

  return NextResponse.json({
    notificacoes,
    naoLidas: notificacoes.some((n) => !n.lida),
  });
}
