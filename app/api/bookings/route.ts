import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/bookings — exige login (ver app/anuncio/[id]/page.tsx).
// Passeio/adestramento: { anuncioId, disponibilidadeId, clienteNome, clienteContato }
// Hospedagem: { anuncioId, checkin, checkout, clienteNome, clienteContato }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ erro: "É preciso entrar na conta pra reservar." }, { status: 401 });
  }
  const clienteId = session.user.id;

  const body = await req.json();
  const { anuncioId, disponibilidadeId, checkin, checkout, clienteNome, clienteContato } = body;

  if (!anuncioId || !clienteNome || !clienteContato) {
    return NextResponse.json({ erro: "Dados incompletos." }, { status: 400 });
  }

  const ehHospedagem = !!checkin && !!checkout;
  if (!ehHospedagem && !disponibilidadeId) {
    return NextResponse.json({ erro: "Dados incompletos." }, { status: 400 });
  }

  const agendamento = await prisma
    .$transaction(async (tx) => {
      if (ehHospedagem) {
        const inicio = new Date(`${checkin}T00:00:00.000Z`);
        const fim = new Date(`${checkout}T00:00:00.000Z`);
        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
          throw new Error("HORARIO_INDISPONIVEL");
        }

        const noites: Date[] = [];
        const cursor = new Date(inicio);
        while (cursor < fim) {
          noites.push(new Date(cursor));
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        const disponiveis = await tx.disponibilidade.findMany({
          where: {
            anuncioId,
            reservada: false,
            inicio: { in: noites },
          },
        });

        // Todas as noites do intervalo precisam estar livres — se faltar
        // uma só, o intervalo inteiro é recusado.
        if (disponiveis.length !== noites.length) {
          throw new Error("HORARIO_INDISPONIVEL");
        }

        await tx.disponibilidade.updateMany({
          where: { id: { in: disponiveis.map((d) => d.id) } },
          data: { reservada: true },
        });

        return tx.agendamento.create({
          data: {
            anuncioId,
            clienteId,
            clienteNome,
            clienteContato,
            dataHoraInicio: inicio,
            dataHoraFim: fim,
            status: "AGUARDANDO_PAGAMENTO",
          },
        });
      }

      const disponibilidade = await tx.disponibilidade.findFirst({
        where: { id: disponibilidadeId, anuncioId, reservada: false },
      });

      if (!disponibilidade) {
        throw new Error("HORARIO_INDISPONIVEL");
      }

      await tx.disponibilidade.update({
        where: { id: disponibilidade.id },
        data: { reservada: true },
      });

      return tx.agendamento.create({
        data: {
          anuncioId,
          clienteId,
          clienteNome,
          clienteContato,
          dataHoraInicio: disponibilidade.inicio,
          dataHoraFim: disponibilidade.fim,
          status: "AGUARDANDO_PAGAMENTO",
        },
      });
    })
    .catch((e) => {
      if (e instanceof Error && e.message === "HORARIO_INDISPONIVEL") return null;
      throw e;
    });

  if (!agendamento) {
    return NextResponse.json(
      { erro: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro." },
      { status: 409 }
    );
  }

  // TODO: chamar a API do Pagar.me aqui para gerar a cobrança
  // e retornar a URL/token de pagamento para o front-end.

  return NextResponse.json({ agendamentoId: agendamento.id });
}
