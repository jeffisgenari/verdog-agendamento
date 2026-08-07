"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BotaoVoltar from "@/components/BotaoVoltar";

export default function RedefinirSenha() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  );
}

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setEnviando(true);
    const res = await fetch("/api/usuario/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, novaSenha: senha }),
    });
    const data = await res.json().catch(() => ({}));
    setEnviando(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível redefinir a senha.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <main className="max-w-xl mx-auto min-h-screen border-x border-neutral-100">
      <BotaoVoltar />

      <div className="flex flex-col items-center pt-8 pb-2">
        <Image src="/logo.png" alt="Verdog" width={1068} height={481} className="h-10 w-auto" priority />
        <div className="text-xs text-neutral-500 mt-2">Escolha uma nova senha</div>
      </div>

      {!token ? (
        <div className="flex flex-col items-center text-center gap-2 px-4 pt-8">
          <p className="text-sm font-medium">Link inválido</p>
          <Link href="/esqueci-senha" className="text-xs text-verdog mt-1">
            Pedir um novo link
          </Link>
        </div>
      ) : sucesso ? (
        <div className="flex flex-col items-center text-center gap-2 px-4 pt-8">
          <p className="text-sm font-medium">Senha redefinida!</p>
          <p className="text-xs text-neutral-500">Te levando pro login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pt-6">
          <label className="text-xs text-neutral-600">
            Nova senha
            <input
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-600">
            Confirmar nova senha
            <input
              type="password"
              name="confirm-new-password"
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>

          {erro && <p className="text-xs text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="bg-verdog text-white text-sm font-medium rounded-lg py-3 mt-1 disabled:opacity-60"
          >
            {enviando ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}
    </main>
  );
}
