import { prisma } from "@/lib/prisma";

// Cancela o agendamento e libera de volta o(s) horário(s)/diária(s)
// consumidos — usado tanto pelo cancelamento manual (cliente/profissional)
// quanto pelo webhook do Pagar.me quando um pagamento falha/expira.
export async function cancelarAgendamento(agendamento: {
  id: string;
  anuncioId: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
}) {
  await prisma.$transaction([
    prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: "CANCELADO" },
    }),
    prisma.disponibilidade.updateMany({
      where: {
        anuncioId: agendamento.anuncioId,
        reservada: true,
        inicio: { gte: agendamento.dataHoraInicio, lt: agendamento.dataHoraFim },
      },
      data: { reservada: false },
    }),
  ]);
}
