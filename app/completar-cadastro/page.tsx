import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EscolhaPerfil from "./EscolhaPerfil";
import AppHeader from "@/components/AppHeader";
import { callbackUrlSeguro } from "@/lib/callbackUrl";

export default async function CompletarCadastro({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = callbackUrlSeguro(searchParams.callbackUrl);
  const session = await getServerSession(authOptions).catch(() => null);

  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  if (session.user.tipo !== "PENDENTE") redirect(callbackUrl);

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />

      <div className="text-center pt-10 pb-2 px-4">
        <div className="text-xl font-medium text-verdog">Quase lá</div>
        <div className="text-xs text-neutral-500 mt-1">
          Como você vai usar o verdog?
        </div>
      </div>

      <EscolhaPerfil callbackUrl={callbackUrl} />
    </main>
  );
}
