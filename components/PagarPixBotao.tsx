"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PagarPixBotao({
  agendamentoId,
  qrCode,
  qrCodeUrl,
  expirado,
}: {
  agendamentoId: string;
  qrCode: string;
  qrCodeUrl: string;
  expirado: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    const intervalo = setInterval(async () => {
      const res = await fetch(`/api/agendamentos/${agendamentoId}/status`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.status && json.status !== "AGUARDANDO_PAGAMENTO") {
        router.refresh();
      }
    }, 4000);

    return () => clearInterval(intervalo);
  }, [aberto, agendamentoId, router]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Alguns navegadores recusam a Clipboard API fora de certos contextos.
    }
  }

  if (expirado) {
    return <span className="text-[11px] text-red-500">Pix expirado</span>;
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex-shrink-0 text-[11px] font-medium rounded-full px-2.5 py-1 bg-verdog text-white"
      >
        Pagar agora
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-2 pt-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrCodeUrl} alt="QR Code Pix" className="w-40 h-40" />
      <button
        type="button"
        onClick={copiar}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[11px] text-neutral-600 break-all text-left"
      >
        {qrCode}
      </button>
      <span className="text-[11px] text-verdog">
        {copiado ? "Código copiado!" : "Clique para copiar"}
      </span>
      <span className="text-[11px] text-neutral-400">Aguardando confirmação do pagamento...</span>
    </div>
  );
}
