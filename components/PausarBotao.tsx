"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function IconPause({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  );
}

export default function PausarBotao({
  anuncioId,
  pausadoInicial,
}: {
  anuncioId: string;
  pausadoInicial: boolean;
}) {
  const router = useRouter();
  const [pausado, setPausado] = useState(pausadoInicial);
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    setCarregando(true);
    const res = await fetch(`/api/anuncios/${anuncioId}/pausar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pausado: !pausado }),
    });
    setCarregando(false);
    if (res.ok) {
      setPausado((p) => !p);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={carregando}
      className={`flex-shrink-0 flex items-center gap-0.5 text-[9px] font-medium rounded-full px-1.5 py-0.5 text-white transition-all duration-200 active:scale-95 disabled:opacity-60 ${
        pausado ? "bg-verdog hover:bg-verdog-dark" : "bg-red-500 hover:bg-red-600"
      }`}
    >
      {pausado ? (
        <IconPlay className="w-2 h-2" />
      ) : (
        <IconPause className="w-2 h-2" />
      )}
      {pausado ? "Retomar" : "Pausar"}
    </button>
  );
}
