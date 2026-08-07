"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelarBotao({ agendamentoId }: { agendamentoId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function confirmar() {
    setCarregando(true);
    const res = await fetch(`/api/agendamentos/${agendamentoId}/cancelar`, {
      method: "PATCH",
    });
    setCarregando(false);
    if (res.ok) {
      setConfirmando(false);
      router.refresh();
    }
  }

  if (confirmando) {
    return (
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] text-neutral-500">Cancelar mesmo?</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={confirmar}
            disabled={carregando}
            className="text-[11px] font-medium rounded-full px-2.5 py-1 bg-red-500 text-white disabled:opacity-60"
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={carregando}
            className="text-[11px] font-medium rounded-full px-2.5 py-1 bg-neutral-100 text-neutral-600"
          >
            Não
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="flex-shrink-0 text-[11px] font-medium rounded-full px-2.5 py-1 border border-neutral-200 text-neutral-500"
    >
      Cancelar
    </button>
  );
}
