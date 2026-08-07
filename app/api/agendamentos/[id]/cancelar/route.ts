import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelarAgendamento } from "@/lib/agendamentos";

// PATCH /api/agendamentos/:id/cancelar — o cliente que reservou ou o
// profissional dono do anúncio podem cancelar. Libera de volta o(s)
// horário(s)/diária(s) consumidos, pra outra pessoa poder reservar.
// Só funciona enquanto AGUARDANDO_PAGAMENTO — uma vez CONFIRMADO (pago de
// verdade), cancelar exigiria estorno manual, então essa rota recusa e o
// front-end direciona a pessoa pro suporte via WhatsApp (ver CancelarBotao).
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
  if (agendamento.status === "CONFIRMADO") {
    return NextResponse.json(
      { error: "Essa reserva já foi paga — o cancelamento precisa passar pelo suporte." },
      { status: 400 }
    );
  }

  await cancelarAgendamento(agendamento);

  return NextResponse.json({ ok: true });
}
