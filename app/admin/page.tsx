import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import AdminNav from "@/components/AdminNav";

function Cartao({ label, valor, href }: { label: string; valor: string | number; href?: string }) {
  const conteudo = (
    <div className="border border-neutral-100 rounded-2xl p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-medium mt-1">{valor}</div>
    </div>
  );
  return href ? <Link href={href}>{conteudo}</Link> : conteudo;
}

export default async function PainelAdmin() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.tipo !== "ADMIN") redirect("/");

  const [
    totalClientes,
    totalProfissionais,
    anunciosPorStatus,
    agendamentosPorStatus,
    faturamento,
    anunciosPendentes,
  ] = await Promise.all([
    prisma.user.count({ where: { tipo: "CLIENTE" } }),
    prisma.user.count({ where: { tipo: "PROFISSIONAL" } }),
    prisma.anuncio.groupBy({ by: ["status"], _count: true }),
    prisma.agendamento.groupBy({ by: ["status"], _count: true }),
    prisma.pagamento.aggregate({ where: { status: "paid" }, _sum: { valor: true } }),
    prisma.anuncio.count({ where: { status: "PENDENTE" } }),
  ]).catch(() => [0, 0, [], [], { _sum: { valor: 0 } }, 0] as const);

  const contarAnuncio = (status: string) =>
    anunciosPorStatus.find((a) => a.status === status)?._count ?? 0;
  const contarAgendamento = (status: string) =>
    agendamentosPorStatus.find((a) => a.status === status)?._count ?? 0;

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />
      <AdminNav ativo="geral" />

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-medium">Visão geral</h1>
      </div>

      <div className="px-4 pb-2">
        <div className="border border-verdog-pale bg-verdog-pale rounded-2xl p-4">
          <div className="text-xs text-verdog-dark">Faturamento confirmado (Pix pago)</div>
          <div className="text-3xl font-semibold text-verdog-dark mt-1">
            R$ {(faturamento._sum.valor ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <Cartao label="Clientes" valor={totalClientes} href="/admin/usuarios" />
        <Cartao label="Profissionais" valor={totalProfissionais} href="/admin/usuarios" />
        <Cartao label="Anúncios aprovados" valor={contarAnuncio("APROVADO")} href="/admin/anuncios" />
        <Cartao
          label="Anúncios pendentes"
          valor={anunciosPendentes}
          href="/admin/anuncios?status=PENDENTE"
        />
        <Cartao
          label="Reservas confirmadas"
          valor={contarAgendamento("CONFIRMADO")}
          href="/admin/reservas?status=CONFIRMADO"
        />
        <Cartao
          label="Aguardando pagamento"
          valor={contarAgendamento("AGUARDANDO_PAGAMENTO")}
          href="/admin/reservas?status=AGUARDANDO_PAGAMENTO"
        />
      </div>

      {anunciosPendentes > 0 && (
        <div className="px-4 pb-6">
          <Link
            href="/admin/anuncios?status=PENDENTE"
            className="block text-center bg-verdog text-white text-sm font-medium rounded-lg py-3"
          >
            {anunciosPendentes} anúncio{anunciosPendentes > 1 ? "s" : ""} esperando aprovação
          </Link>
        </div>
      )}
    </main>
  );
}
