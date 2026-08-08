import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Só usado em app/completar-cadastro (EscolhaPerfil) — a escolha de
// cliente/profissional é de mão única, feita uma vez só no primeiro acesso.
// Sem essa checagem de tipo atual, qualquer conta já definida conseguia
// chamar essa rota direto e trocar de papel a qualquer momento.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (session.user.tipo !== "PENDENTE") {
    return NextResponse.json(
      { error: "Essa conta já escolheu cliente ou profissional." },
      { status: 403 }
    );
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
