import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { consumirToken } from "@/lib/tokens";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";

export default async function VerificarEmail({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const email = searchParams.token
    ? await consumirToken(searchParams.token, "VERIFICACAO_EMAIL")
    : null;

  if (email) {
    await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  }

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="flex flex-col items-center text-center gap-3 px-4 pt-16 pb-10">
        {email ? (
          <>
            <div className="w-12 h-12 rounded-full bg-verdog-pale text-verdog flex items-center justify-center text-2xl">
              ✓
            </div>
            <p className="text-base font-medium">E-mail confirmado!</p>
            <p className="text-sm text-neutral-500">Sua conta já está verificada.</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium">Link inválido ou expirado</p>
            <p className="text-sm text-neutral-500">
              Peça um novo link de verificação em "Meus dados".
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-2 bg-verdog text-white text-sm font-medium rounded-lg px-5 py-2.5"
        >
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
