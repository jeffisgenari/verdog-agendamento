import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/anuncios/:id/pausar  { pausado: boolean } — só o dono.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.tipo !== "PROFISSIONAL") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { pausado } = await req.json();
  if (typeof pausado !== "boolean") {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: params.id },
    include: { profissional: true },
  });
  if (!anuncio) {
    return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });
  }
  if (anuncio.profissional.userId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  await prisma.anuncio.update({ where: { id: params.id }, data: { pausado } });

  return NextResponse.json({ ok: true, pausado });
}
