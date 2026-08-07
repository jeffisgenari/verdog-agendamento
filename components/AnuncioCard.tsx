import Link from "next/link";
import Avatar from "@/components/Avatar";

const ZONA_LABEL: Record<string, string> = {
  NORTE: "Zona Norte",
  SUL: "Zona Sul",
  LESTE: "Zona Leste",
  OESTE: "Zona Oeste",
  CENTRO: "Centro",
};

type AnuncioCardProps = {
  id: string;
  titulo: string;
  tipoServico: "PASSEIO" | "ADESTRAMENTO" | "HOSPEDAGEM";
  preco: number;
  local: string;
  zona: string;
  fotos: { url: string }[];
  profissional: { nome: string; user: { image: string | null } | null };
};

export default function AnuncioCard({ a }: { a: AnuncioCardProps }) {
  return (
    <Link
      href={`/anuncio/${a.id}`}
      className="relative flex gap-3 border border-neutral-100 rounded-2xl p-2"
    >
      <div className="w-32 h-32 rounded-xl bg-verdog-light flex-shrink-0 overflow-hidden self-start">
        {a.fotos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.fotos[0].url}
            alt={a.titulo}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <span className="absolute bottom-2 right-2 bg-verdog text-white text-[10px] font-medium rounded-full px-2 py-1 shadow">
        + Reservar
      </span>
      <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
        <span className="text-sm font-medium truncate">{a.titulo}</span>
        <span className="text-xs text-verdog truncate mt-0.5">
          {a.tipoServico === "PASSEIO" && "Passeio"}
          {a.tipoServico === "ADESTRAMENTO" && "Adestramento"}
          {a.tipoServico === "HOSPEDAGEM" && "Hospedagem"}
          {" · "}
          {a.local} · {ZONA_LABEL[a.zona]}
        </span>
        <span className="text-sm font-medium mt-1">
          R$ {a.preco.toFixed(0)}
          {a.tipoServico === "HOSPEDAGEM" ? " / diária" : ""}
        </span>
        <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
          <Avatar
            src={a.profissional.user?.image}
            nome={a.profissional.nome}
            className="w-4 h-4 text-[9px]"
          />
          <span className="text-[11px] text-neutral-400 truncate">
            {a.profissional.nome}
          </span>
        </div>
      </div>
    </Link>
  );
}
