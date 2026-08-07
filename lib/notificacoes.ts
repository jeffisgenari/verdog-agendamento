import { prisma } from "@/lib/prisma";

export async function criarNotificacao(params: {
  userId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
}) {
  await prisma.notificacao.create({
    data: {
      userId: params.userId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensagem: params.mensagem,
      link: params.link,
    },
  });
}
