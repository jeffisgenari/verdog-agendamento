"use client";

import { useRouter } from "next/navigation";

function IconSeta({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BotaoVoltar() {
  const router = useRouter();

  return (
    <div className="px-4 py-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 h-9 px-3 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium"
      >
        <IconSeta className="w-4 h-4" />
        Voltar
      </button>
    </div>
  );
}
