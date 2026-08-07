import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// O Pagar.me chama esta rota quando o status de um pagamento muda.
// Documentação: https://docs.pagar.me (seção Webhooks)
export async function POST(req: NextRequest) {
  const evento = await req.json();

  // TODO: validar a assinatura do webhook (header enviado pelo Pagar.me)
  // antes de confiar no conteúdo do corpo — evita que qualquer pessoa
  // chame essa rota e "confirme" pagamentos falsos.

  const idTransacao = evento?.data?.id;
  const status = evento?.data?.status; // ex: "paid", "failed"
  const agendamentoId = evento?.data?.metadata?.agendamentoId;

  if (!agendamentoId) {
    return NextResponse.json({ erro: "agendamentoId ausente no metadata" }, { status: 400 });
  }

  if (status === "paid") {
    await prisma.agendamento.update({
      where: { id: agendamentoId },
      data: { status: "CONFIRMADO" },
    });
    await prisma.pagamento.upsert({
      where: { agendamentoId },
      update: { status, idTransacaoPagarme: idTransacao },
      create: {
        agendamentoId,
        idTransacaoPagarme: idTransacao,
        valor: evento?.data?.amount ? evento.data.amount / 100 : 0,
        status,
      },
    });
  } else if (status === "failed") {
    await prisma.agendamento.update({
      where: { id: agendamentoId },
      data: { status: "CANCELADO" },
    });
  }

  return NextResponse.json({ recebido: true });
}
