import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { tipo } = await request.json();
  if (tipo !== "CLIENTE" && tipo !== "PROFISSIONAL") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { tipo },
  });

  if (tipo === "PROFISSIONAL") {
    await prisma.profissional.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
        nome: session.user.name ?? "Profissional",
        email: session.user.email!,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
