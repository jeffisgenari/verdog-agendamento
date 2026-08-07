"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkWhatsapp, SUPORTE_TELEFONE } from "@/lib/whatsapp";

export default function CancelarBotao({
  agendamentoId,
  status,
}: {
  agendamentoId: string;
  status: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const jaPago = status === "CONFIRMADO";

  async function confirmar() {
    setCarregando(true);
    const res = await fetch(`/api/agendamentos/${agendamentoId}/cancelar`, {
      method: "PATCH",
    });
    setCarregando(false);
    if (res.ok) {
      setAberto(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex-shrink-0 text-[11px] font-medium rounded-full px-2.5 py-1 border border-neutral-200 text-neutral-500"
      >
        Cancelar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !carregando && setAberto(false)}
          />

          {jaPago ? (
            <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
              <h2 className="text-base font-semibold">Essa reserva já foi paga</h2>
              <p className="text-sm text-neutral-600">
                Cancelamentos de reservas já pagas passam pelo nosso suporte,
                porque envolvem estorno. Fala com a gente pelo WhatsApp que
                resolvemos rapidinho.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="flex-1 text-sm font-medium rounded-lg py-2.5 border border-neutral-200 text-neutral-700"
                >
                  Fechar
                </button>
                <a
                  href={linkWhatsapp(
                    SUPORTE_TELEFONE,
                    `Olá! Preciso cancelar uma reserva já paga (código ${agendamentoId}).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-sm font-medium rounded-lg py-2.5 bg-verdog text-white"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
              <h2 className="text-base font-semibold">Cancelar essa reserva?</h2>
              <p className="text-sm text-neutral-600">
                O horário volta a ficar disponível pra outra pessoa reservar. Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  disabled={carregando}
                  className="flex-1 text-sm font-medium rounded-lg py-2.5 border border-neutral-200 text-neutral-700 disabled:opacity-60"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={confirmar}
                  disabled={carregando}
                  className="flex-1 text-sm font-medium rounded-lg py-2.5 bg-red-500 text-white disabled:opacity-60"
                >
                  {carregando ? "Cancelando..." : "Cancelar reserva"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
