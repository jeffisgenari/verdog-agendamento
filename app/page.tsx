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

const ZONAS = [
  { valor: "", label: "Todas as zonas", Icon: IconTodos },
  { valor: "NORTE", label: "Zona Norte" },
  { valor: "SUL", label: "Zona Sul" },
  { valor: "OESTE", label: "Zona Oeste" },
  { valor: "CENTRO", label: "Centro" },
] as const;

// Server Component: busca os anúncios já aprovados direto do banco.
// searchParams.tipo e searchParams.zona controlam os filtros (combinam entre si).
export default async function Home({
  searchParams,
}: {
  searchParams: { tipo?: string; zona?: string };
}) {
  const tipo = searchParams.tipo;
  const zona = searchParams.zona;

  function hrefComFiltros(overrides: { tipo?: string; zona?: string }) {
    const tipoFinal = overrides.tipo !== undefined ? overrides.tipo : tipo;
    const zonaFinal = overrides.zona !== undefined ? overrides.zona : zona;
    const params = new URLSearchParams();
    if (tipoFinal && tipoFinal !== "TODOS") params.set("tipo", tipoFinal);
    if (zonaFinal) params.set("zona", zonaFinal);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

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
        ...(zona ? { zona: zona as any } : {}),
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
              href={hrefComFiltros({ tipo: f.valor })}
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

      <div className="flex items-center justify-between px-4 pb-3">
        {ZONAS.map((z) => {
          const ativo = (zona ?? "") === z.valor;
          const Icon = "Icon" in z ? z.Icon : null;
          return (
            <Link
              key={z.valor}
              href={hrefComFiltros({ zona: z.valor })}
              title={z.label}
              aria-label={Icon ? z.label : undefined}
              className={`flex items-center justify-center whitespace-nowrap text-[11px] font-medium rounded-full flex-shrink-0 transition-colors ${
                Icon ? "w-7 h-7" : "px-2.5 py-1.5"
              } ${ativo ? "bg-verdog text-white" : "bg-verdog-pale text-verdog-dark"}`}
            >
              {Icon ? <Icon className="w-3.5 h-3.5" /> : z.label}
            </Link>
          );
        })}
      </div>

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
