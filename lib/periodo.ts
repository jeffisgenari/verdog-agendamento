export function formatarPeriodo(
  tipoServico: "PASSEIO" | "ADESTRAMENTO" | "HOSPEDAGEM",
  inicio: Date,
  fim: Date
) {
  if (tipoServico === "HOSPEDAGEM") {
    return `${inicio.toLocaleDateString("pt-BR", { timeZone: "UTC" })} → ${fim.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`;
  }
  return `${inicio.toLocaleDateString("pt-BR")} às ${inicio.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  AGUARDANDO_PAGAMENTO: { label: "Aguardando pagamento", className: "bg-amber-50 text-amber-700" },
  CONFIRMADO: { label: "Confirmado", className: "bg-verdog-pale text-verdog-dark" },
  CANCELADO: { label: "Cancelado", className: "bg-neutral-100 text-neutral-500" },
};
