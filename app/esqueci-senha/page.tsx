"use client";

import { useState } from "react";
import Image from "next/image";
import BotaoVoltar from "@/components/BotaoVoltar";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await fetch("/api/usuario/esqueci-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setEnviando(false);
    setEnviado(true);
  }

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <BotaoVoltar />

      <div className="flex flex-col items-center pt-8 pb-2">
        <Image src="/logo.png" alt="Verdog" width={1068} height={481} className="h-10 w-auto" priority />
        <div className="text-xs text-neutral-500 mt-2 text-center px-8">
          Informe seu e-mail e mandamos um link pra redefinir sua senha
        </div>
      </div>

      {enviado ? (
        <div className="flex flex-col items-center text-center gap-2 px-4 pt-8">
          <p className="text-sm font-medium">Confira seu e-mail</p>
          <p className="text-xs text-neutral-500">
            Se existir uma conta com esse e-mail, mandamos um link pra redefinir a senha.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pt-6">
          <label className="text-xs text-neutral-600">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seunome@email.com"
              required
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="bg-verdog text-white text-sm font-medium rounded-lg py-3 mt-1 disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}
    </main>
  );
}
