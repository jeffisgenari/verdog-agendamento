import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

type TipoToken = "VERIFICACAO_EMAIL" | "REDEFINIR_SENHA";

const EXPIRA_EM_HORAS: Record<TipoToken, number> = {
  VERIFICACAO_EMAIL: 48,
  REDEFINIR_SENHA: 1,
};

// Cria um token de uso único pra um e-mail — invalida qualquer token do
// mesmo tipo pendente pra esse e-mail antes de criar o novo.
export async function criarToken(email: string, tipo: TipoToken) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EXPIRA_EM_HORAS[tipo] * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier: email, tipo } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires, tipo } });

  return token;
}

// Valida e consome (apaga) um token — retorna o e-mail associado, ou null
// se o token não existir, for de outro tipo, ou já tiver expirado.
export async function consumirToken(token: string, tipo: TipoToken) {
  const registro = await prisma.verificationToken.findUnique({ where: { token } });
  if (!registro || registro.tipo !== tipo || registro.expires < new Date()) {
    return null;
  }
  await prisma.verificationToken.delete({ where: { token } });
  return registro.identifier;
}
