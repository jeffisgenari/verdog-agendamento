"use client";

import { useState } from "react";

export default function ReenviarVerificacaoBotao() {
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "erro">("idle");

  async function reenviar() {
    setEstado("enviando");
    const res = await fetch("/api/usuario/reenviar-verificacao", { method: "POST" });
    setEstado(res.ok ? "enviado" : "erro");
  }

  if (estado === "enviado") {
    return <span className="text-xs text-verdog">E-mail enviado — confira sua caixa de entrada.</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={reenviar}
        disabled={estado === "enviando"}
        className="text-[11px] font-medium rounded-full px-2.5 py-1 border border-neutral-200 text-neutral-600 disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando..." : "Reenviar verificação"}
      </button>
      {estado === "erro" && <span className="text-[11px] text-red-600">Falhou, tenta de novo.</span>}
    </div>
  );
}
