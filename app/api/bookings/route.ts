import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cpfValido } from "@/lib/cpf";
import { criarCobrancaPix } from "@/lib/pagarme";
import { cancelarAgendamento } from "@/lib/agendamentos";
import { RateLimit } from "@/lib/ratelimit";

// POST /api/bookings — exige login (ver app/anuncio/[id]/page.tsx).
// Passeio/adestramento: { anuncioId, disponibilidadeId, clienteNome, clienteContato, clienteCpf }
// Hospedagem: { anuncioId, checkin, checkout, clienteNome, clienteContato, clienteCpf }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ erro: "É preciso entrar na conta pra reservar." }, { status: 401 });
  }
  const clienteId = session.user.id;

  if (await RateLimit.reserva(clienteId)) {
    return NextResponse.json(
      { erro: "Muitas reservas em pouco tempo. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { anuncioId, disponibilidadeId, checkin, checkout, clienteNome, clienteContato } = body;

  if (!anuncioId || !clienteNome || !clienteContato || !body.clienteCpf) {
    return NextResponse.json({ erro: "Dados incompletos." }, { status: 400 });
  }
  if (!cpfValido(body.clienteCpf)) {
    return NextResponse.json({ erro: "CPF inválido." }, { status: 400 });
  }
  const clienteCpf: string = body.clienteCpf.replace(/\D/g, "");

  const anuncio = await prisma.anuncio.findUnique({ where: { id: anuncioId } });
  if (!anuncio || anuncio.status !== "APROVADO" || anuncio.pausado) {
    return NextResponse.json({ erro: "Anúncio não encontrado." }, { status: 404 });
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
            clienteCpf,
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
          clienteCpf,
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

  const noites = ehHospedagem
    ? Math.round(
        (agendamento.dataHoraFim.getTime() - agendamento.dataHoraInicio.getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : 1;
  const valorCentavos = Math.round(anuncio.preco * noites * 100);

  try {
    const cobranca = await criarCobrancaPix({
      agendamentoId: agendamento.id,
      valorCentavos,
      descricao: anuncio.titulo,
      clienteNome,
      clienteCpf,
      clienteTelefone: clienteContato,
      clienteEmail: session.user.email ?? "",
    });

    await prisma.pagamento.create({
      data: {
        agendamentoId: agendamento.id,
        idTransacaoPagarme: cobranca.chargeId,
        valor: valorCentavos / 100,
        status: "waiting_payment",
        pixQrCode: cobranca.qrCode,
        pixQrCodeUrl: cobranca.qrCodeUrl,
        pixExpiraEm: cobranca.expiraEm,
      },
    });

    return NextResponse.json({
      agendamentoId: agendamento.id,
      pix: {
        qrCode: cobranca.qrCode,
        qrCodeUrl: cobranca.qrCodeUrl,
        expiraEm: cobranca.expiraEm,
      },
    });
  } catch (e) {
    // Não conseguimos gerar a cobrança — desfaz o agendamento e libera o
    // horário de volta, pra não deixar um horário "preso" sem cobrança.
    await cancelarAgendamento(agendamento);
    return NextResponse.json(
      { erro: "Não foi possível gerar a cobrança Pix. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
