import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import IconEditar from "@/components/IconEditar";

const STATUS_ANUNCIO_LABEL: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Em análise", className: "bg-amber-50 text-amber-700" },
  APROVADO: { label: "Publicado", className: "bg-verdog-pale text-verdog-dark" },
  REJEITADO: { label: "Recusado", className: "bg-red-50 text-red-600" },
};

export default async function MeusAnuncios() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/meus-anuncios");
  if (session.user.tipo !== "PROFISSIONAL") redirect("/");

  const profissional = await prisma.profissional.findUnique({
    where: { userId: session.user.id },
  });
  if (!profissional) redirect("/");

  const anuncios = await prisma.anuncio.findMany({
    where: { profissionalId: profissional.id },
    include: { fotos: { orderBy: { ordem: "asc" }, take: 1 } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-base font-medium">Meus anúncios</h1>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {anuncios.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">
            Você ainda não criou nenhum anúncio.
          </li>
        )}
        {anuncios.map((a) => {
          const status = STATUS_ANUNCIO_LABEL[a.status] ?? {
            label: a.status,
            className: "bg-neutral-100 text-neutral-500",
          };
          return (
            <li key={a.id}>
              <Link
                href={`/anuncios/${a.id}/editar`}
                className="relative flex gap-3 border border-neutral-100 rounded-2xl p-2"
              >
                <div className="w-20 h-20 rounded-xl bg-verdog-light flex-shrink-0 overflow-hidden">
                  {a.fotos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.fotos[0].url}
                      alt={a.titulo}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{a.titulo}</span>
                  <span className="text-sm font-medium mt-0.5">R$ {a.preco.toFixed(0)}</span>
                  <span
                    className={`self-start text-[11px] font-medium rounded-lg px-1.5 py-0.5 mt-1 ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-verdog text-white text-[10px] font-medium rounded-full pl-1.5 pr-2 py-1 shadow">
                  <IconEditar className="w-3 h-3" />
                  Editar
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
