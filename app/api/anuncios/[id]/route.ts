import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ZONAS = ["NORTE", "SUL", "LESTE", "OESTE", "CENTRO"] as const;
const MAX_FOTOS = 8;
const MAX_NOITES_POR_JANELA = 366;

function expandirNoites(inicioStr: string, fimStr: string) {
  const inicio = new Date(`${inicioStr}T00:00:00.000Z`);
  const fim = new Date(`${fimStr}T00:00:00.000Z`);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
    return null;
  }

  const noites: { inicio: Date; fim: Date }[] = [];
  const cursor = new Date(inicio);
  while (cursor < fim) {
    const proximo = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    noites.push({ inicio: new Date(cursor), fim: proximo });
    cursor.setTime(proximo.getTime());
    if (noites.length > MAX_NOITES_POR_JANELA) return null;
  }
  return noites;
}

// PATCH /api/anuncios/:id  { status: "APROVADO" | "REJEITADO" } — só admin.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.tipo !== "ADMIN") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  }

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

// PUT /api/anuncios/:id — o profissional dono edita o próprio anúncio.
// Não mexe no status (aprovado continua aprovado, sem passar por revisão de novo).
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.tipo !== "PROFISSIONAL") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const anuncioAtual = await prisma.anuncio.findUnique({
    where: { id: params.id },
    include: { profissional: true, fotos: true, disponibilidades: true },
  });
  if (!anuncioAtual) {
    return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });
  }
  if (anuncioAtual.profissional.userId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const {
    titulo,
    descricao,
    preco,
    local,
    zona,
    localHospedagem,
    novasDisponibilidades,
    novasFotos,
    fotosParaRemover,
    disponibilidadesParaRemover,
  } = await req.json();

  if (typeof titulo !== "string" || !titulo.trim()) {
    return NextResponse.json({ error: "O título é obrigatório." }, { status: 400 });
  }
  if (typeof descricao !== "string" || !descricao.trim()) {
    return NextResponse.json({ error: "A descrição é obrigatória." }, { status: 400 });
  }
  if (typeof local !== "string" || !local.trim()) {
    return NextResponse.json({ error: "O local é obrigatório." }, { status: 400 });
  }
  if (!ZONAS.includes(zona)) {
    return NextResponse.json({ error: "Selecione a zona." }, { status: 400 });
  }
  const precoNumero = Number(preco);
  if (!Number.isFinite(precoNumero) || precoNumero <= 0) {
    return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
  }
  const ehHospedagem = anuncioAtual.tipoServico === "HOSPEDAGEM";
  if (ehHospedagem && (typeof localHospedagem !== "string" || !localHospedagem.trim())) {
    return NextResponse.json({ error: "Informe onde é a hospedagem." }, { status: 400 });
  }

  const idsParaRemover: string[] = Array.isArray(fotosParaRemover) ? fotosParaRemover : [];
  const idsValidos = new Set(anuncioAtual.fotos.map((f) => f.id));
  if (idsParaRemover.some((id) => !idsValidos.has(id))) {
    return NextResponse.json({ error: "Foto inválida pra remover." }, { status: 400 });
  }

  const novasFotosLista: string[] = Array.isArray(novasFotos) ? novasFotos : [];
  if (novasFotosLista.some((f) => typeof f !== "string" || !f.startsWith("data:image/"))) {
    return NextResponse.json({ error: "Foto inválida." }, { status: 400 });
  }

  const totalFotos = anuncioAtual.fotos.length - idsParaRemover.length + novasFotosLista.length;
  if (totalFotos < 1) {
    return NextResponse.json({ error: "O anúncio precisa de pelo menos uma foto." }, { status: 400 });
  }
  if (totalFotos > MAX_FOTOS) {
    return NextResponse.json({ error: `No máximo ${MAX_FOTOS} fotos.` }, { status: 400 });
  }

  const idsDispParaRemover: string[] = Array.isArray(disponibilidadesParaRemover)
    ? disponibilidadesParaRemover
    : [];
  const dispPorId = new Map(anuncioAtual.disponibilidades.map((d) => [d.id, d]));
  for (const id of idsDispParaRemover) {
    const disp = dispPorId.get(id);
    if (!disp) {
      return NextResponse.json({ error: "Horário inválido pra remover." }, { status: 400 });
    }
    if (disp.reservada) {
      return NextResponse.json(
        { error: "Esse horário já foi reservado por um cliente, não dá pra remover." },
        { status: 400 }
      );
    }
  }

  const novosSlots: { inicio: Date; fim: Date }[] = [];
  if (Array.isArray(novasDisponibilidades)) {
    if (ehHospedagem) {
      for (const d of novasDisponibilidades as { inicio: string; fim: string }[]) {
        const noites = expandirNoites(d?.inicio, d?.fim);
        if (!noites) {
          return NextResponse.json({ error: "Período disponível inválido." }, { status: 400 });
        }
        novosSlots.push(...noites);
      }
    } else {
      for (const d of novasDisponibilidades as { inicio: string; fim: string }[]) {
        const inicio = new Date(d?.inicio);
        const fim = new Date(d?.fim);
        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
          return NextResponse.json({ error: "Horário disponível inválido." }, { status: 400 });
        }
        novosSlots.push({ inicio, fim });
      }
    }
  }

  const proximaOrdem = anuncioAtual.fotos.length
    ? Math.max(...anuncioAtual.fotos.map((f) => f.ordem)) + 1
    : 0;

  await prisma.$transaction(async (tx) => {
    if (idsParaRemover.length > 0) {
      await tx.foto.deleteMany({ where: { id: { in: idsParaRemover } } });
    }
    if (idsDispParaRemover.length > 0) {
      // Revalida "não reservada" dentro da transação, pra não dar brecha de
      // corrida com um cliente reservando bem nesse instante.
      await tx.disponibilidade.deleteMany({
        where: { id: { in: idsDispParaRemover }, reservada: false },
      });
    }
    await tx.anuncio.update({
      where: { id: params.id },
      data: {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        preco: precoNumero,
        local: local.trim(),
        zona,
        localHospedagem: ehHospedagem ? localHospedagem.trim() : null,
        fotos: {
          create: novasFotosLista.map((url, i) => ({ url, ordem: proximaOrdem + i })),
        },
        disponibilidades: novosSlots.length > 0 ? { create: novosSlots } : undefined,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
