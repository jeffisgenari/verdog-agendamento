import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Cancela o agendamento e libera de volta o(s) horário(s)/diária(s)
// consumidos — usado tanto pelo cancelamento manual (cliente/profissional)
// quanto pelo webhook do Pagar.me quando um pagamento falha/expira.
// `operacoesExtras` roda na MESMA transação (ex: marcar o Pagamento como
// falhado) — importante pro webhook: se o agendamento virasse CANCELADO mas
// o Pagamento não fosse atualizado por causa de um erro qualquer, uma nova
// tentativa do Pagar.me não chegaria mais nesse trecho de novo (o
// agendamento já não estaria mais "aguardando pagamento"), deixando o
// registro de pagamento preso pra sempre.
export async function cancelarAgendamento(
  agendamento: {
    id: string;
    anuncioId: string;
    dataHoraInicio: Date;
    dataHoraFim: Date;
  },
  operacoesExtras: Prisma.PrismaPromise<unknown>[] = []
) {
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
    ...operacoesExtras,
  ]);
}
