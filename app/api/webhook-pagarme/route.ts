import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { cancelarAgendamento } from "@/lib/agendamentos";
import { criarNotificacao } from "@/lib/notificacoes";

// O Pagar.me chama esta rota quando o status de uma cobrança muda.
// Autenticado por usuário/senha (Basic Auth) — configurado na criação do
// webhook no painel do Pagar.me (Webhooks > Criar > Habilitar autenticação),
// não por assinatura HMAC.
// Formato real do payload (confirmado direto no painel, aba Webhooks > um
// evento > Request — a documentação pública mostra um formato diferente e
// enganoso): { id, type, account, created_at, data: <cobrança> }, onde
// `data` já É a cobrança (não um pedido com uma lista `charges`) — `data.id`
// é o id da cobrança (ch_...), `data.status` e `data.metadata` ficam direto
// nela.

function autenticacaoValida(cabecalhoAuth: string | null) {
  const usuarioEsperado = process.env.PAGARME_WEBHOOK_USER;
  const senhaEsperada = process.env.PAGARME_WEBHOOK_PASSWORD;
  if (!usuarioEsperado || !senhaEsperada || !cabecalhoAuth?.startsWith("Basic ")) return false;

  const decodificado = Buffer.from(cabecalhoAuth.slice(6), "base64").toString("utf8");
  const separador = decodificado.indexOf(":");
  if (separador === -1) return false;

  const usuario = decodificado.slice(0, separador);
  const senha = decodificado.slice(separador + 1);

  const usuarioBuf = Buffer.from(usuario);
  const usuarioEsperadoBuf = Buffer.from(usuarioEsperado);
  const senhaBuf = Buffer.from(senha);
  const senhaEsperadaBuf = Buffer.from(senhaEsperada);

  const usuarioOk =
    usuarioBuf.length === usuarioEsperadoBuf.length &&
    crypto.timingSafeEqual(usuarioBuf, usuarioEsperadoBuf);
  const senhaOk =
    senhaBuf.length === senhaEsperadaBuf.length &&
    crypto.timingSafeEqual(senhaBuf, senhaEsperadaBuf);

  return usuarioOk && senhaOk;
}

const STATUS_PAGO = "paid";
const STATUS_FALHOU = ["failed", "canceled", "refused"];

export async function POST(req: NextRequest) {
  if (!autenticacaoValida(req.headers.get("authorization"))) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const corpoBruto = await req.text();
  let evento: unknown;
  try {
    evento = JSON.parse(corpoBruto);
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }
  const cobranca = (evento as { data?: any })?.data;
  const agendamentoId: string | undefined =
    cobranca?.metadata?.agendamentoId ?? cobranca?.order?.metadata?.agendamentoId;

  if (!agendamentoId || !cobranca?.status) {
    return NextResponse.json({ recebido: true });
  }

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: agendamentoId },
    include: { anuncio: { include: { profissional: true } } },
  });
  if (!agendamento || agendamento.status !== "AGUARDANDO_PAGAMENTO") {
    return NextResponse.json({ recebido: true });
  }

  if (cobranca.status === STATUS_PAGO) {
    await prisma.$transaction([
      prisma.agendamento.update({
        where: { id: agendamentoId },
        data: { status: "CONFIRMADO" },
      }),
      prisma.pagamento.update({
        where: { agendamentoId },
        data: { status: cobranca.status, idTransacaoPagarme: cobranca.id },
      }),
    ]);

    // Notificação é melhor-esforço — não pode derrubar a confirmação do
    // pagamento se falhar por algum motivo.
    const titulo = agendamento.anuncio.titulo;
    if (agendamento.clienteId) {
      await criarNotificacao({
        userId: agendamento.clienteId,
        tipo: "RESERVA_CONFIRMADA",
        titulo: "Pagamento confirmado!",
        mensagem: `Sua reserva de "${titulo}" foi confirmada.`,
        link: "/meus-pedidos",
      }).catch(() => null);
    }
    if (agendamento.anuncio.profissional.userId) {
      await criarNotificacao({
        userId: agendamento.anuncio.profissional.userId,
        tipo: "RESERVA_CONFIRMADA",
        titulo: "Nova reserva confirmada!",
        mensagem: `${agendamento.clienteNome} confirmou o pagamento de "${titulo}".`,
        link: "/meus-clientes",
      }).catch(() => null);
    }
  } else if (STATUS_FALHOU.includes(cobranca.status)) {
    await cancelarAgendamento(agendamento, [
      prisma.pagamento.update({
        where: { agendamentoId },
        data: { status: cobranca.status },
      }),
    ]);
  }

  return NextResponse.json({ recebido: true });
}
