import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarPeriodo, STATUS_LABEL } from "@/lib/periodo";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import AdminNav from "@/components/AdminNav";

const FILTROS = [
  { valor: "", label: "Todas" },
  { valor: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
  { valor: "CONFIRMADO", label: "Confirmadas" },
  { valor: "CANCELADO", label: "Canceladas" },
] as const;

export default async function AdminReservas({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/admin/reservas");
  if (session.user.tipo !== "ADMIN") redirect("/");

  const statusFiltro = searchParams.status ?? "";

  const reservas = await prisma.agendamento
    .findMany({
      where: statusFiltro ? { status: statusFiltro as any } : {},
      include: { anuncio: { include: { profissional: true } }, pagamento: true },
      orderBy: { criadoEm: "desc" },
      take: 100,
    })
    .catch(() => []);

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />
      <AdminNav ativo="reservas" />

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-medium">Reservas</h1>
      </div>

      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {FILTROS.map((f) => (
          <a
            key={f.valor}
            href={f.valor ? `/admin/reservas?status=${f.valor}` : "/admin/reservas"}
            className={`text-xs font-medium rounded-full px-3 py-1.5 flex-shrink-0 border whitespace-nowrap ${
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
        {reservas.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">Nenhuma reserva encontrada.</li>
        )}
        {reservas.map((r) => {
          const info = STATUS_LABEL[r.status] ?? { label: r.status, className: "bg-neutral-100 text-neutral-500" };
          return (
            <li key={r.id} className="border border-neutral-100 rounded-2xl p-3 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">{r.anuncio.titulo}</div>
                <span className={`text-[11px] font-medium rounded-lg px-2 py-1 flex-shrink-0 ${info.className}`}>
                  {info.label}
                </span>
              </div>
              <div className="text-xs text-neutral-500">
                Cliente: {r.clienteNome} · Profissional: {r.anuncio.profissional.nome}
              </div>
              <div className="text-xs text-verdog">
                {formatarPeriodo(r.anuncio.tipoServico, r.dataHoraInicio, r.dataHoraFim)}
              </div>
              <div className="text-xs text-neutral-500">
                {r.pagamento ? `R$ ${r.pagamento.valor.toFixed(2)} · ${r.pagamento.status}` : "Sem cobrança"}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
