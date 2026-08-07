"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AprovarBotoes({ anuncioId }: { anuncioId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function atualizar(status: "APROVADO" | "REJEITADO") {
    setEnviando(true);
    await fetch(`/api/anuncios/${anuncioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEnviando(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 pt-1">
      <button
        onClick={() => atualizar("APROVADO")}
        disabled={enviando}
        className="bg-verdog text-white text-xs font-medium rounded-lg px-4 py-2 disabled:opacity-60"
      >
        Aprovar
      </button>
      <button
        onClick={() => atualizar("REJEITADO")}
        disabled={enviando}
        className="border border-neutral-200 text-neutral-600 text-xs font-medium rounded-lg px-4 py-2 disabled:opacity-60"
      >
        Rejeitar
      </button>
    </div>
  );
}
