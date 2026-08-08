import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { imagemValida } from "@/lib/imagemValidacao";

const TIPOS_SERVICO = ["PASSEIO", "ADESTRAMENTO", "HOSPEDAGEM"] as const;
const ZONAS = ["NORTE", "SUL", "OESTE", "CENTRO"] as const;
const MAX_FOTOS = 8;
const MAX_NOITES_POR_JANELA = 366;

// Para hospedagem, cada janela (ex: 15/08 a 30/08) vira uma linha de
// Disponibilidade por noite — é isso que permite o cliente escolher
// check-in/check-out livremente num calendário depois.
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

// POST /api/anuncios — cria um novo anúncio para o profissional logado.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.tipo !== "PROFISSIONAL") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const profissional = await prisma.profissional
    .findUnique({ where: { userId: session.user.id } })
    .catch(() => null);
  if (!profissional) {
    return NextResponse.json(
      { error: "Cadastro de profissional não encontrado." },
      { status: 404 }
    );
  }

  const { tipoServico, titulo, descricao, preco, local, zona, localHospedagem, disponibilidades, fotos } =
    await request.json();

  if (!TIPOS_SERVICO.includes(tipoServico)) {
    return NextResponse.json({ error: "Tipo de serviço inválido." }, { status: 400 });
  }
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
  if (
    tipoServico === "HOSPEDAGEM" &&
    (typeof localHospedagem !== "string" || !localHospedagem.trim())
  ) {
    return NextResponse.json(
      { error: "Informe onde é a hospedagem." },
      { status: 400 }
    );
  }

  if (!Array.isArray(disponibilidades) || disponibilidades.length === 0) {
    return NextResponse.json(
      { error: "Adicione pelo menos um horário disponível." },
      { status: 400 }
    );
  }

  if (!Array.isArray(fotos) || fotos.length === 0) {
    return NextResponse.json(
      { error: "Adicione pelo menos uma foto." },
      { status: 400 }
    );
  }

  const slots: { inicio: Date; fim: Date }[] = [];
  if (tipoServico === "HOSPEDAGEM") {
    for (const d of disponibilidades as { inicio: string; fim: string }[]) {
      const noites = expandirNoites(d?.inicio, d?.fim);
      if (!noites) {
        return NextResponse.json({ error: "Período disponível inválido." }, { status: 400 });
      }
      slots.push(...noites);
    }
  } else {
    for (const d of disponibilidades as { inicio: string; fim: string }[]) {
      const inicio = new Date(d?.inicio);
      const fim = new Date(d?.fim);
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
        return NextResponse.json({ error: "Horário disponível inválido." }, { status: 400 });
      }
      slots.push({ inicio, fim });
    }
  }

  const listaFotos: string[] = Array.isArray(fotos) ? fotos.slice(0, MAX_FOTOS) : [];
  if (listaFotos.some((f) => !imagemValida(f))) {
    return NextResponse.json({ error: "Foto inválida." }, { status: 400 });
  }

  const anuncio = await prisma.anuncio.create({
    data: {
      profissionalId: profissional.id,
      tipoServico,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      preco: precoNumero,
      local: local.trim(),
      zona,
      localHospedagem: tipoServico === "HOSPEDAGEM" ? localHospedagem.trim() : null,
      disponibilidades: { create: slots },
      fotos: {
        create: listaFotos.map((url, ordem) => ({ url, ordem })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: anuncio.id });
}
