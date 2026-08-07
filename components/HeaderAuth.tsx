"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Avatar from "@/components/Avatar";

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMais({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharSeClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", fecharSeClicarFora);
    return () => document.removeEventListener("mousedown", fecharSeClicarFora);
  }, []);

  if (status === "loading") {
    return <div className="w-9 h-9" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="bg-verdog text-white text-sm font-medium rounded-lg px-4 py-2"
      >
        Entrar
      </Link>
    );
  }

  const ehProfissional = session.user.tipo === "PROFISSIONAL";

  return (
    <div className="flex items-center gap-2">
      {ehProfissional && (
        <Link
          href="/anuncios/novo"
          title="Anunciar"
          className="flex items-center gap-1 h-9 px-3 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium"
        >
          <IconMais className="w-4 h-4" />
          Anunciar
        </Link>
      )}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label="Abrir menu"
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-verdog text-white"
        >
          <IconMenu className="w-5 h-5" />
        </button>

        {aberto && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 rounded-2xl shadow-lg py-2 z-10">
            <div className="flex items-center gap-2 px-4 py-2">
              <Avatar
                src={session.user.image}
                nome={session.user.name}
                className="w-7 h-7 text-xs"
              />
              <span className="text-xs text-neutral-500 truncate">
                {session.user.name ?? session.user.email}
              </span>
            </div>

            {ehProfissional && (
              <>
                <Link
                  href="/anuncios/novo"
                  onClick={() => setAberto(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-verdog-pale"
                >
                  Adicionar anúncio
                </Link>
                <Link
                  href="/meus-anuncios"
                  onClick={() => setAberto(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-verdog-pale"
                >
                  Meus anúncios
                </Link>
                <Link
                  href="/meus-clientes"
                  onClick={() => setAberto(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-verdog-pale"
                >
                  Meus clientes
                </Link>
              </>
            )}

            {session.user.tipo === "CLIENTE" && (
              <Link
                href="/meus-pedidos"
                onClick={() => setAberto(false)}
                className="block px-4 py-2.5 text-sm hover:bg-verdog-pale"
              >
                Meus pedidos
              </Link>
            )}

            <Link
              href="/minha-conta"
              onClick={() => setAberto(false)}
              className="block px-4 py-2.5 text-sm hover:bg-verdog-pale"
            >
              Meus dados
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-verdog-pale"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
