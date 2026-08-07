import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/anuncios/:id  { status: "APROVADO" | "REJEITADO" }
// TODO: proteger esta rota para que só a conta admin consiga chamá-la.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();

  if (!["APROVADO", "REJEITADO"].includes(status)) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  const anuncio = await prisma.anuncio.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(anuncio);
}
