"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function EscolhaPerfil({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [carregando, setCarregando] = useState<"CLIENTE" | "PROFISSIONAL" | null>(null);

  async function escolher(tipo: "CLIENTE" | "PROFISSIONAL") {
    setCarregando(tipo);
    await fetch("/api/usuario/definir-tipo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo }),
    });
    // Sem isso o token de sessão continua achando que a pessoa está PENDENTE.
    await update();
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-6">
      <button
        onClick={() => escolher("CLIENTE")}
        disabled={carregando !== null}
        className="border border-neutral-200 rounded-2xl p-4 text-left disabled:opacity-60"
      >
        <div className="text-sm font-medium">Sou cliente</div>
        <div className="text-xs text-neutral-500 mt-0.5">
          Quero agendar passeio, adestramento ou hospedagem para meu pet.
        </div>
      </button>

      <button
        onClick={() => escolher("PROFISSIONAL")}
        disabled={carregando !== null}
        className="border border-neutral-200 rounded-2xl p-4 text-left disabled:opacity-60"
      >
        <div className="text-sm font-medium">Sou profissional</div>
        <div className="text-xs text-neutral-500 mt-0.5">
          Sou passeador, adestrador ou ofereço hospedagem para pets.
        </div>
      </button>
    </div>
  );
}
