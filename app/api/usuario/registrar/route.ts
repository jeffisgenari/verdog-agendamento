import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cpfValido } from "@/lib/cpf";
import { criarToken } from "@/lib/tokens";
import { enviarEmailVerificacao } from "@/lib/email";
import { RateLimit, ipDaRequisicao } from "@/lib/ratelimit";

export async function POST(request: Request) {
  if (await RateLimit.registro(ipDaRequisicao(request.headers))) {
    return NextResponse.json(
      { error: "Muitas contas criadas nesse endereço. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const { nome, email, telefone, cpf, senha, endereco, numero, complemento } =
    await request.json();

  const obrigatorios = { nome, email, telefone, cpf, senha, endereco, numero };
  for (const [campo, valor] of Object.entries(obrigatorios)) {
    if (typeof valor !== "string" || !valor.trim()) {
      return NextResponse.json(
        { error: `O campo "${campo}" é obrigatório.` },
        { status: 400 }
      );
    }
  }
  if (!cpfValido(cpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
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
      cpf: cpf.replace(/\D/g, ""),
      senhaHash,
      endereco: endereco.trim(),
      numero: numero.trim(),
      complemento: complemento?.trim() || null,
    },
  });

  // Não deixa a criação da conta falhar por causa do e-mail — a pessoa pode
  // pedir pra reenviar depois em "Meus dados".
  await enviarEmailDeVerificacao(emailNormalizado).catch(() => null);

  return NextResponse.json({ ok: true });
}

async function enviarEmailDeVerificacao(email: string) {
  const token = await criarToken(email, "VERIFICACAO_EMAIL");
  const link = `${process.env.NEXTAUTH_URL}/verificar-email?token=${token}`;
  await enviarEmailVerificacao(email, link);
}
