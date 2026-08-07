import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import AdminNav from "@/components/AdminNav";
import AprovarBotoes from "@/components/AprovarBotoes";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: "Em análise", className: "bg-amber-50 text-amber-700" },
  APROVADO: { label: "Publicado", className: "bg-verdog-pale text-verdog-dark" },
  REJEITADO: { label: "Recusado", className: "bg-red-50 text-red-600" },
};

const FILTROS = [
  { valor: "", label: "Todos" },
  { valor: "PENDENTE", label: "Pendentes" },
  { valor: "APROVADO", label: "Aprovados" },
  { valor: "REJEITADO", label: "Rejeitados" },
] as const;

export default async function AdminAnuncios({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/admin/anuncios");
  if (session.user.tipo !== "ADMIN") redirect("/");

  const statusFiltro = searchParams.status ?? "";

  const anuncios = await prisma.anuncio
    .findMany({
      where: statusFiltro ? { status: statusFiltro as any } : {},
      include: { profissional: true },
      orderBy: { criadoEm: "desc" },
      take: 100,
    })
    .catch(() => []);

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />
      <AdminNav ativo="anuncios" />

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-medium">Anúncios</h1>
      </div>

      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {FILTROS.map((f) => (
          <a
            key={f.valor}
            href={f.valor ? `/admin/anuncios?status=${f.valor}` : "/admin/anuncios"}
            className={`text-xs font-medium rounded-full px-3 py-1.5 flex-shrink-0 border ${
              statusFiltro === f.valor
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-600"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {anuncios.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">Nenhum anúncio encontrado.</li>
        )}
        {anuncios.map((a) => {
          const info = STATUS_LABEL[a.status] ?? { label: a.status, className: "bg-neutral-100 text-neutral-500" };
          return (
            <li key={a.id} className="border border-neutral-100 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{a.titulo}</div>
                  <div className="text-xs text-neutral-500">
                    {a.profissional.nome} · {a.tipoServico} · R$ {a.preco}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] font-medium rounded-lg px-2 py-1 ${info.className}`}>
                    {info.label}
                  </span>
                  {a.pausado && (
                    <span className="text-[11px] font-medium rounded-lg px-2 py-1 bg-neutral-100 text-neutral-500">
                      Pausado
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-neutral-600">{a.descricao}</div>
              {a.status === "PENDENTE" && <AprovarBotoes anuncioId={a.id} />}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
