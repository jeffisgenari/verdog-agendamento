import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/agendamentos/:id/status — usado pela tela de pagamento Pix pra
// saber quando o webhook do Pagar.me confirmou (ou recusou) o pagamento.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: params.id },
    include: { anuncio: { include: { profissional: true } } },
  });
  if (!agendamento) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const ehCliente = agendamento.clienteId === session.user.id;
  const ehProfissionalDono = agendamento.anuncio.profissional.userId === session.user.id;
  if (!ehCliente && !ehProfissionalDono) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  return NextResponse.json({ status: agendamento.status });
}
