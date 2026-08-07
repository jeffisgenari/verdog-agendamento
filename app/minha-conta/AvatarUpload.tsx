"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Avatar from "@/components/Avatar";
import { comprimirImagem } from "@/lib/imagem";

export default function AvatarUpload({
  imagemInicial,
  nome,
}: {
  imagemInicial: string | null;
  nome: string | null;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [imagem, setImagem] = useState(imagemInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro("");
    setEnviando(true);
    try {
      const dataUrl = await comprimirImagem(arquivo, 400, 0.8);
      const res = await fetch("/api/usuario/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) throw new Error();

      setImagem(dataUrl);
      await update();
      router.refresh();
    } catch {
      setErro("Não foi possível atualizar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="relative cursor-pointer">
        <Avatar src={imagem} nome={nome} className="w-20 h-20 text-2xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-verdog text-white flex items-center justify-center text-xs">
          ✎
        </div>
        <input type="file" accept="image/*" onChange={handleSelecionar} className="hidden" />
      </label>
      {enviando && <span className="text-xs text-neutral-400">Enviando...</span>}
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  );
}
