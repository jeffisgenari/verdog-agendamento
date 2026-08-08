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
    <svg viewBox="10 3 80 94" fill="currentColor" className={className}>
      <path d="m20.684 46.652v23.758l-7.2656 12.242c-0.28516 0.48438-0.29297 1.082-0.015625 1.5703 0.27734 0.48828 0.79688 0.78906 1.3594 0.78906h25.102c0.75781 4.9375 4.9961 8.7383 10.137 8.7383s9.3789-3.8008 10.141-8.7344h25.102c0.5625 0 1.082-0.30078 1.3594-0.78906 0.27734-0.48828 0.27344-1.0898-0.015624-1.5703l-7.2695-12.246v-23.758c0-12.848-8.3047-24.066-20.418-27.91 0.34766-0.99219 0.52734-2.0273 0.52734-3.0625 0.003907-5.1992-4.2266-9.4297-9.4258-9.4297s-9.4297 4.2305-9.4297 9.4297c0 1.0352 0.17969 2.0703 0.52734 3.0625-12.113 3.8438-20.414 15.062-20.414 27.91z" />
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
        <IconSino className="w-6 h-6 text-verdog" />
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
