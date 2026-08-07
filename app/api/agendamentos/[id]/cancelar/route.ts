import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/agendamentos/:id/cancelar — o cliente que reservou ou o
// profissional dono do anúncio podem cancelar. Libera de volta o(s)
// horário(s)/diária(s) consumidos, pra outra pessoa poder reservar.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  if (agendamento.status === "CANCELADO") {
    return NextResponse.json({ error: "Esse agendamento já está cancelado." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: "CANCELADO" },
    }),
    // Libera de volta a(s) disponibilidade(s) consumida(s) por esse
    // agendamento — pra passeio/adestramento é uma linha só, pra
    // hospedagem são todas as noites entre check-in e check-out.
    prisma.disponibilidade.updateMany({
      where: {
        anuncioId: agendamento.anuncioId,
        reservada: true,
        inicio: { gte: agendamento.dataHoraInicio, lt: agendamento.dataHoraFim },
      },
      data: { reservada: false },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
