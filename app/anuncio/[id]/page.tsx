import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ReservaForm from "@/components/ReservaForm";
import Avatar from "@/components/Avatar";
import GaleriaFotos from "@/components/GaleriaFotos";

const ZONA_LABEL: Record<string, string> = {
  NORTE: "Zona Norte",
  SUL: "Zona Sul",
  LESTE: "Zona Leste",
  OESTE: "Zona Oeste",
  CENTRO: "Centro",
};

export default async function PaginaAnuncio({
  params,
}: {
  params: { id: string };
}) {
  const anuncio = await prisma.anuncio.findUnique({
    where: { id: params.id },
    include: {
      fotos: { orderBy: { ordem: "asc" } },
      profissional: { include: { user: true } },
      disponibilidades: {
        where: { reservada: false },
        orderBy: { inicio: "asc" },
      },
    },
  });

  if (!anuncio || anuncio.status !== "APROVADO") notFound();

  const ehHospedagem = anuncio.tipoServico === "HOSPEDAGEM";

  const session = await getServerSession(authOptions).catch(() => null);
  const usuarioLogado = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } }).catch(() => null)
    : null;

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
        <a href="/" className="text-sm text-neutral-500">
          ← Voltar
        </a>
      </header>

      <GaleriaFotos fotos={anuncio.fotos} titulo={anuncio.titulo} />

      <div className="px-4 py-2">
        <h1 className="text-2xl font-medium">{anuncio.titulo}</h1>
        <p className="text-xs text-verdog my-1">
          {anuncio.tipoServico === "PASSEIO" && "Passeio"}
          {anuncio.tipoServico === "ADESTRAMENTO" && "Adestramento"}
          {anuncio.tipoServico === "HOSPEDAGEM" && "Hospedagem"}
          {" · "}
          {anuncio.local} · {ZONA_LABEL[anuncio.zona]}
        </p>
        <p className="text-sm text-neutral-600 leading-relaxed">
          {anuncio.descricao}
        </p>

        <Link
          href={`/profissional/${anuncio.profissional.id}`}
          className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100"
        >
          <Avatar
            src={anuncio.profissional.user?.image}
            nome={anuncio.profissional.nome}
            className="w-8 h-8 text-sm"
          />
          <span className="text-xs text-neutral-600">{anuncio.profissional.nome}</span>
        </Link>
      </div>

      <ReservaForm
        anuncioId={anuncio.id}
        preco={anuncio.preco}
        tipoServico={anuncio.tipoServico}
        usuarioLogado={
          usuarioLogado ? { nome: usuarioLogado.name, telefone: usuarioLogado.telefone } : null
        }
        loginUrl={`/login?callbackUrl=${encodeURIComponent(`/anuncio/${anuncio.id}`)}`}
        disponibilidades={
          ehHospedagem
            ? []
            : anuncio.disponibilidades.map((d) => ({
                id: d.id,
                inicio: d.inicio.toISOString(),
                fim: d.fim.toISOString(),
              }))
        }
        noitesDisponiveis={
          ehHospedagem ? anuncio.disponibilidades.map((d) => d.inicio.toISOString()) : []
        }
      />
    </main>
  );
}
