import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarPeriodo } from "@/lib/periodo";
import { linkWhatsapp } from "@/lib/whatsapp";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";
import IconWhatsapp from "@/components/IconWhatsapp";
import AppHeader from "@/components/AppHeader";
import BotaoVoltar from "@/components/BotaoVoltar";
import CancelarBotao from "@/components/CancelarBotao";

export default async function MeusClientes() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) redirect("/login?callbackUrl=/meus-clientes");
  if (session.user.tipo !== "PROFISSIONAL") redirect("/");

  const profissional = await prisma.profissional.findUnique({
    where: { userId: session.user.id },
  });
  if (!profissional) redirect("/");

  const [todosPedidos, faturamento, aguardandoCount, proxima] = await Promise.all([
    prisma.agendamento.findMany({
      where: { anuncio: { profissionalId: profissional.id } },
      include: { anuncio: true, cliente: true },
    }),
    prisma.pagamento.aggregate({
      where: { status: "paid", agendamento: { anuncio: { profissionalId: profissional.id } } },
      _sum: { valor: true },
    }),
    prisma.agendamento.count({
      where: { status: "AGUARDANDO_PAGAMENTO", anuncio: { profissionalId: profissional.id } },
    }),
    prisma.agendamento.findFirst({
      where: {
        status: "CONFIRMADO",
        anuncio: { profissionalId: profissional.id },
        dataHoraInicio: { gte: new Date() },
      },
      orderBy: { dataHoraInicio: "asc" },
      include: { anuncio: true },
    }),
  ]);

  // Próximas primeiro (a mais perto de acontecer no topo), depois as que já
  // passaram (a mais recente primeiro) — em vez de ordem de criação.
  const agora = new Date();
  const futuros = todosPedidos
    .filter((p) => p.dataHoraInicio >= agora)
    .sort((a, b) => a.dataHoraInicio.getTime() - b.dataHoraInicio.getTime());
  const passados = todosPedidos
    .filter((p) => p.dataHoraInicio < agora)
    .sort((a, b) => b.dataHoraInicio.getTime() - a.dataHoraInicio.getTime());
  const pedidos = [...futuros, ...passados];

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <AppHeader />
      <BotaoVoltar />

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-base font-medium">Meus clientes</h1>
      </div>

      <div className="px-4 pb-2 flex flex-col gap-2">
        <div className="border border-verdog-pale bg-verdog-pale rounded-2xl p-4">
          <div className="text-xs text-verdog-dark">Recebido confirmado</div>
          <div className="text-2xl font-semibold text-verdog-dark mt-0.5">
            R$ {(faturamento._sum.valor ?? 0).toFixed(2)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-neutral-100 rounded-2xl p-3">
            <div className="text-xs text-neutral-500">Aguardando pagamento</div>
            <div className="text-xl font-medium mt-0.5">{aguardandoCount}</div>
          </div>
          <div className="border border-neutral-100 rounded-2xl p-3">
            <div className="text-xs text-neutral-500">Próxima reserva</div>
            {proxima ? (
              <div className="text-xs font-medium mt-1 leading-snug">
                {proxima.anuncio.titulo}
                <div className="text-verdog">
                  {formatarPeriodo(proxima.anuncio.tipoServico, proxima.dataHoraInicio, proxima.dataHoraFim)}
                </div>
              </div>
            ) : (
              <div className="text-xl font-medium mt-0.5 text-neutral-300">—</div>
            )}
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-6">
        {pedidos.length === 0 && (
          <li className="text-sm text-neutral-500 text-center py-10">
            Nenhum cliente reservou ainda.
          </li>
        )}
        {pedidos.map((p) => {
          const mensagem = `Olá ${p.clienteNome}! Sobre a sua reserva de "${p.anuncio.titulo}"...`;
          return (
            <li
              key={p.id}
              className="flex flex-col gap-2.5 border border-neutral-100 rounded-2xl p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar src={p.cliente?.image} nome={p.clienteNome} className="w-10 h-10 text-sm flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{p.clienteNome}</span>
                  <span className="text-xs text-neutral-500 truncate block">{p.anuncio.titulo}</span>
                  <span className="text-xs text-verdog">
                    {formatarPeriodo(p.anuncio.tipoServico, p.dataHoraInicio, p.dataHoraFim)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={p.status} />
                <div className="flex items-center gap-2">
                  {p.status !== "CANCELADO" && <CancelarBotao agendamentoId={p.id} status={p.status} />}
                  <a
                    href={linkWhatsapp(p.clienteContato, mensagem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Falar no WhatsApp"
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-verdog text-white flex items-center justify-center"
                  >
                    <IconWhatsapp className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
