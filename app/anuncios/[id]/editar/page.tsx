import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import EditarAnuncioForm from "./EditarAnuncioForm";

export default async function EditarAnuncio({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login");
  if (session.user.tipo !== "PROFISSIONAL") redirect("/");

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: params.id },
    include: {
      profissional: true,
      fotos: { orderBy: { ordem: "asc" } },
      disponibilidades: { where: { reservada: false }, orderBy: { inicio: "asc" } },
    },
  });

  if (!anuncio) notFound();
  if (anuncio.profissional.userId !== session.user.id) redirect("/meus-anuncios");

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-base font-medium">Editar anúncio</h1>
        <p className="text-xs text-neutral-500 mt-1">
          As alterações valem na hora — não precisa passar por aprovação de novo.
        </p>
      </div>

      <EditarAnuncioForm
        anuncio={{
          id: anuncio.id,
          tipoServico: anuncio.tipoServico,
          titulo: anuncio.titulo,
          descricao: anuncio.descricao,
          preco: anuncio.preco,
          local: anuncio.local,
          zona: anuncio.zona,
          localHospedagem: anuncio.localHospedagem,
          fotos: anuncio.fotos.map((f) => ({ id: f.id, url: f.url })),
          disponibilidades: anuncio.disponibilidades.map((d) => ({
            id: d.id,
            inicio: d.inicio.toISOString(),
            fim: d.fim.toISOString(),
          })),
        }}
      />
    </main>
  );
}
