import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import AnuncioCard from "@/components/AnuncioCard";
import AppHeader from "@/components/AppHeader";

export default async function PerfilProfissional({
  params,
}: {
  params: { id: string };
}) {
  const profissional = await prisma.profissional.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      anuncios: {
        where: { status: "APROVADO" },
        include: { fotos: true, profissional: { include: { user: true } } },
        orderBy: { criadoEm: "desc" },
      },
    },
  });

  if (!profissional) notFound();

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />

      <div className="flex flex-col items-center gap-2 px-4 pt-8 pb-4">
        <Avatar
          src={profissional.user?.image}
          nome={profissional.nome}
          className="w-20 h-20 text-2xl"
        />
        <h1 className="text-base font-medium">{profissional.nome}</h1>
      </div>

      <div className="px-4 pb-2">
        <div className="text-xs text-neutral-400">
          {profissional.anuncios.length} anúncio
          {profissional.anuncios.length !== 1 ? "s" : ""}
        </div>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {profissional.anuncios.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">
            Nenhum anúncio publicado ainda.
          </li>
        )}
        {profissional.anuncios.map((a) => (
          <li key={a.id}>
            <AnuncioCard a={a} />
          </li>
        ))}
      </ul>
    </main>
  );
}
