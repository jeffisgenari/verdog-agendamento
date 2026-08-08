import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import AdminNav from "@/components/AdminNav";

const TIPO_LABEL: Record<string, string> = {
  CLIENTE: "Cliente",
  PROFISSIONAL: "Profissional",
  ADMIN: "Administrador",
  PENDENTE: "Pendente",
};

const FILTROS = [
  { valor: "", label: "Todos" },
  { valor: "CLIENTE", label: "Clientes" },
  { valor: "PROFISSIONAL", label: "Profissionais" },
] as const;

export default async function AdminUsuarios({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/admin/usuarios");
  if (session.user.tipo !== "ADMIN") redirect("/");

  const tipoFiltro = searchParams.tipo ?? "";

  const usuarios = await prisma.user
    .findMany({
      where: tipoFiltro ? { tipo: tipoFiltro as any } : {},
      // Só os campos usados na tela — sem trazer senhaHash/cpf/endereço pra
      // memória do servidor à toa.
      select: { id: true, name: true, email: true, tipo: true, criadoEm: true, emailVerified: true },
      orderBy: { criadoEm: "desc" },
      take: 100,
    })
    .catch(() => []);

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />
      <AdminNav ativo="usuarios" />

      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-medium">Usuários</h1>
      </div>

      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {FILTROS.map((f) => (
          <a
            key={f.valor}
            href={f.valor ? `/admin/usuarios?tipo=${f.valor}` : "/admin/usuarios"}
            className={`text-xs font-medium rounded-full px-3 py-1.5 flex-shrink-0 border ${
              tipoFiltro === f.valor
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-600"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <ul className="flex flex-col gap-2 px-4 pb-6">
        {usuarios.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">Nenhum usuário encontrado.</li>
        )}
        {usuarios.map((u) => (
          <li key={u.id} className="border border-neutral-100 rounded-2xl p-3 flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium">{u.name ?? "—"}</div>
              <div className="text-xs text-neutral-500">{u.email}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Desde {u.criadoEm.toLocaleDateString("pt-BR")}
                {u.emailVerified ? " · e-mail verificado" : " · e-mail não verificado"}
              </div>
            </div>
            <span className="text-[11px] font-medium rounded-lg px-2 py-1 bg-neutral-100 text-neutral-600 flex-shrink-0">
              {TIPO_LABEL[u.tipo] ?? u.tipo}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
