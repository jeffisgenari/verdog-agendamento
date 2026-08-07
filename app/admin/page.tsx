import { prisma } from "@/lib/prisma";
import AprovarBotoes from "@/components/AprovarBotoes";
import LogoutButton from "@/components/LogoutButton";

// TODO: proteger esta rota — só a conta admin pode acessar.
// Sugestão: usar NextAuth com um papel "admin" no Profissional,
// e um middleware que redireciona quem não tiver esse papel.
export default async function PainelAdmin() {
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
      <header className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h1 className="text-base font-medium">Anúncios pendentes</h1>
        <LogoutButton />
      </header>

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
