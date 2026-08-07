import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { nome, email, telefone, senha, endereco, numero, complemento } =
    await request.json();

  const obrigatorios = { nome, email, telefone, senha, endereco, numero };
  for (const [campo, valor] of Object.entries(obrigatorios)) {
    if (typeof valor !== "string" || !valor.trim()) {
      return NextResponse.json(
        { error: `O campo "${campo}" é obrigatório.` },
        { status: 400 }
      );
    }
  }

  const emailNormalizado = email.trim().toLowerCase();

  const existente = await prisma.user
    .findUnique({ where: { email: emailNormalizado } })
    .catch(() => undefined);

  if (existente === undefined) {
    return NextResponse.json(
      { error: "Banco de dados ainda não configurado. Tente novamente mais tarde." },
      { status: 503 }
    );
  }
  if (existente) {
    return NextResponse.json(
      { error: "Já existe uma conta com esse e-mail." },
      { status: 409 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.user.create({
    data: {
      name: nome.trim(),
      email: emailNormalizado,
      telefone: telefone.trim(),
      senhaHash,
      endereco: endereco.trim(),
      numero: numero.trim(),
      complemento: complemento?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
