import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AprovarBotoes from "@/components/AprovarBotoes";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";

export default async function PainelAdmin() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.tipo !== "ADMIN") redirect("/");

  // TODO(demo): sem DATABASE_URL configurado ainda, cai no catch e mostra lista vazia.
  const pendentes = await prisma.anuncio
    .findMany({
      where: { status: "PENDENTE" },
      include: { fotos: true, profissional: true },
      orderBy: { criadoEm: "asc" },
    })
    .catch(() => []);

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="px-4 py-3 border-b border-neutral-100">
        <h1 className="text-base font-medium">Anúncios pendentes</h1>
      </div>

      <ul className="flex flex-col gap-3 px-4 py-4">
        {pendentes.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">
            Nenhum anúncio aguardando aprovação.
          </li>
        )}
        {pendentes.map((a) => (
          <li
            key={a.id}
            className="border border-neutral-100 rounded-2xl p-3 flex flex-col gap-2"
          >
            <div className="text-sm font-medium">{a.titulo}</div>
            <div className="text-xs text-neutral-500">
              {a.profissional.nome} · {a.tipoServico}
            </div>
            <div className="text-sm text-neutral-600">{a.descricao}</div>
            <AprovarBotoes anuncioId={a.id} />
          </li>
        ))}
      </ul>
    </main>
  );
}
