import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NovoAnuncioForm from "./NovoAnuncioForm";

export default async function NovoAnuncio() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session?.user) redirect("/login");
  if (session.user.tipo !== "PROFISSIONAL") redirect("/");

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <header className="px-4 py-3 border-b border-neutral-100 text-sm text-neutral-500">
        <a href="/">← Voltar</a>
      </header>

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-base font-medium">Novo anúncio</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Depois de enviado, seu anúncio passa por aprovação antes de aparecer
          pro público.
        </p>
      </div>

      <NovoAnuncioForm />
    </main>
  );
}
