import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumirToken } from "@/lib/tokens";

export async function POST(request: Request) {
  const { token, novaSenha } = await request.json();

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }
  if (typeof novaSenha !== "string" || novaSenha.length < 8) {
    return NextResponse.json({ error: "A senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const email = await consumirToken(token, "REDEFINIR_SENHA");
  if (!email) {
    return NextResponse.json(
      { error: "Esse link expirou ou já foi usado. Peça um novo." },
      { status: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.user.update({ where: { email }, data: { senhaHash } });

  return NextResponse.json({ ok: true });
}
