"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  criadoEm: string;
};

function IconSino({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a6 6 0 0 0-6 6c0 4.5-1.5 6-1.5 6h15S18 12.5 18 8a6 6 0 0 0-6-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0h-4Z" />
    </svg>
  );
}

export default function SininhoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);

  async function buscar() {
    const res = await fetch("/api/notificacoes");
    if (!res.ok) return;
    const json = await res.json();
    setNotificacoes(json.notificacoes);
    setNaoLidas(json.naoLidas);
  }

  useEffect(() => {
    buscar();
    const intervalo = setInterval(buscar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    function fecharSeClicarFora(e: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", fecharSeClicarFora);
    return () => document.removeEventListener("mousedown", fecharSeClicarFora);
  }, []);

  async function abrir() {
    setAberto((v) => !v);
    if (!naoLidas) return;
    setNaoLidas(false);
    setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })));
    await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
  }

  return (
    <div className="relative" ref={painelRef}>
      <button
        onClick={abrir}
        aria-label="Notificações"
        className="relative flex items-center justify-center w-9 h-9"
      >
        <IconSino className="w-5 h-5 text-verdog" />
        {naoLidas && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white border border-neutral-100 rounded-2xl shadow-lg py-2 z-10">
          {notificacoes.length === 0 && (
            <p className="px-4 py-6 text-xs text-neutral-400 text-center">
              Nenhuma notificação por enquanto.
            </p>
          )}
          {notificacoes.map((n) => {
            const conteudo = (
              <>
                <div className="text-sm font-medium">{n.titulo}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{n.mensagem}</div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  {new Date(n.criadoEm).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </>
            );

            return n.link ? (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => setAberto(false)}
                className="block px-4 py-2.5 hover:bg-verdog-pale border-b border-neutral-50 last:border-b-0"
              >
                {conteudo}
              </Link>
            ) : (
              <div key={n.id} className="px-4 py-2.5 border-b border-neutral-50 last:border-b-0">
                {conteudo}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
