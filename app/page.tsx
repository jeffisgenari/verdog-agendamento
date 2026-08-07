import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  IconTodos,
  IconPasseio,
  IconAdestramento,
  IconHospedagem,
} from "@/components/FiltroIcons";
import AppHeader from "@/components/AppHeader";
import AnuncioCard from "@/components/AnuncioCard";

const FILTROS = [
  { valor: "TODOS", label: "Todos", Icon: IconTodos },
  { valor: "PASSEIO", label: "Passeio", Icon: IconPasseio },
  { valor: "ADESTRAMENTO", label: "Adestramento", Icon: IconAdestramento },
  { valor: "HOSPEDAGEM", label: "Hospedagem", Icon: IconHospedagem },
] as const;

// Server Component: busca os anúncios já aprovados direto do banco.
// searchParams.tipo controla o filtro (?tipo=PASSEIO)
export default async function Home({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const tipo = searchParams.tipo;

  // Quem acabou de entrar (Google ou cadastro) e ainda não escolheu
  // "cliente" ou "profissional" é levado pra completar o cadastro antes de
  // ver a home.
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.tipo === "PENDENTE") redirect("/completar-cadastro");
  if (session?.user?.tipo === "ADMIN") redirect("/admin");

  // TODO(demo): sem DATABASE_URL configurado ainda, cai no catch e mostra lista vazia.
  const anuncios = await prisma.anuncio
    .findMany({
      where: {
        status: "APROVADO",
        pausado: false,
        ...(tipo && tipo !== "TODOS" ? { tipoServico: tipo as any } : {}),
      },
      include: { fotos: true, profissional: { include: { user: true } } },
      orderBy: { criadoEm: "desc" },
    })
    .catch(() => []);

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />

      <nav className="grid grid-cols-2 gap-2 px-4 py-3">
        {FILTROS.map((f) => {
          const ativo = (tipo ?? "TODOS") === f.valor;
          return (
            <Link
              key={f.valor}
              href={f.valor === "TODOS" ? "/" : `/?tipo=${f.valor}`}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-3 transition-colors ${
                ativo
                  ? "bg-verdog text-white"
                  : "bg-verdog-pale text-verdog-dark"
              }`}
            >
              <f.Icon
                className={`w-6 h-6 flex-shrink-0 ${
                  ativo ? "text-white" : "text-verdog"
                }`}
              />
              <span className="text-sm font-medium">{f.label}</span>
            </Link>
          );
        })}
      </nav>

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {anuncios.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">
            Nenhum anúncio publicado ainda.
          </li>
        )}
        {anuncios.map((a) => (
          <li key={a.id}>
            <AnuncioCard a={a} />
          </li>
        ))}
      </ul>
    </main>
  );
}
