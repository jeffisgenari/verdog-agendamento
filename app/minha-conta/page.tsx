import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AvatarUpload from "./AvatarUpload";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import { formatarCpf } from "@/lib/cpf";
import ReenviarVerificacaoBotao from "@/components/ReenviarVerificacaoBotao";

const TIPO_LABEL: Record<string, string> = {
  CLIENTE: "Cliente",
  PROFISSIONAL: "Profissional",
  ADMIN: "Administrador",
  PENDENTE: "Pendente",
};

function Campo({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-b-0">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-sm mt-0.5">{valor || "—"}</div>
    </div>
  );
}

export default async function MinhaConta() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login");

  const usuario = await prisma.user
    .findUnique({ where: { id: session.user.id } })
    .catch(() => null);

  if (!usuario) redirect("/login");

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-base font-medium">Meus dados</h1>
      </div>

      <div className="px-4 py-4">
        <AvatarUpload imagemInicial={usuario.image} nome={usuario.name} />
      </div>

      <div className="px-4">
        <Campo label="Nome" valor={usuario.name} />
        <div className="py-3 border-b border-neutral-100">
          <div className="text-xs text-neutral-400">E-mail</div>
          <div className="text-sm mt-0.5">{usuario.email}</div>
          <div className="mt-1.5">
            {usuario.emailVerified ? (
              <span className="text-[11px] text-verdog">✓ Verificado</span>
            ) : (
              <ReenviarVerificacaoBotao />
            )}
          </div>
        </div>
        <Campo label="Telefone" valor={usuario.telefone} />
        <Campo label="CPF" valor={usuario.cpf ? formatarCpf(usuario.cpf) : null} />
        <Campo
          label="Endereço"
          valor={
            usuario.endereco
              ? `${usuario.endereco}, ${usuario.numero ?? ""}${
                  usuario.complemento ? ` — ${usuario.complemento}` : ""
                }`
              : null
          }
        />
        <Campo label="Tipo de conta" valor={TIPO_LABEL[usuario.tipo] ?? usuario.tipo} />
      </div>
    </main>
  );
}
