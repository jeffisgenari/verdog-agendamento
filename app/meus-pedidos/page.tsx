import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarPeriodo } from "@/lib/periodo";
import { linkWhatsapp } from "@/lib/whatsapp";
import StatusBadge from "@/components/StatusBadge";
import IconWhatsapp from "@/components/IconWhatsapp";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import CancelarBotao from "@/components/CancelarBotao";

export default async function MeusPedidos() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/meus-pedidos");

  const pedidos = await prisma.agendamento.findMany({
    where: { clienteId: session.user.id },
    include: { anuncio: { include: { profissional: { include: { user: true } } } } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-base font-medium">Minhas reservas</h1>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {pedidos.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">
            Você ainda não fez nenhuma reserva.
          </li>
        )}
        {pedidos.map((p) => {
          const numeroProfissional = p.anuncio.profissional.telefone || p.anuncio.profissional.user?.telefone;
          const podeFalarNoWhatsapp = p.status === "CONFIRMADO" && numeroProfissional;
          const mensagem = `Olá ${p.anuncio.profissional.nome}! Sobre a minha reserva de "${p.anuncio.titulo}"...`;

          return (
            <li
              key={p.id}
              className="flex flex-col gap-2.5 border border-neutral-100 rounded-2xl p-3"
            >
              <Link href={`/anuncio/${p.anuncioId}`}>
                <span className="text-sm font-medium truncate block">{p.anuncio.titulo}</span>
                <span className="text-xs text-neutral-500 truncate block">
                  {p.anuncio.profissional.nome}
                </span>
                <span className="text-xs text-verdog">
                  {formatarPeriodo(p.anuncio.tipoServico, p.dataHoraInicio, p.dataHoraFim)}
                </span>
              </Link>

              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={p.status} />
                <div className="flex items-center gap-2">
                  {p.status !== "CANCELADO" && <CancelarBotao agendamentoId={p.id} />}
                  {podeFalarNoWhatsapp && (
                    <a
                      href={linkWhatsapp(numeroProfissional!, mensagem)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Falar no WhatsApp"
                      className="flex-shrink-0 w-9 h-9 rounded-full bg-verdog text-white flex items-center justify-center"
                    >
                      <IconWhatsapp className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
