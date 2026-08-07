import Link from "next/link";

const LINKS = [
  { key: "geral", href: "/admin", label: "Visão geral" },
  { key: "anuncios", href: "/admin/anuncios", label: "Anúncios" },
  { key: "reservas", href: "/admin/reservas", label: "Reservas" },
  { key: "usuarios", href: "/admin/usuarios", label: "Usuários" },
] as const;

export default function AdminNav({ ativo }: { ativo: (typeof LINKS)[number]["key"] }) {
  return (
    <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-neutral-100">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className={`text-xs font-medium rounded-full px-3 py-1.5 flex-shrink-0 ${
            ativo === l.key ? "bg-verdog text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
