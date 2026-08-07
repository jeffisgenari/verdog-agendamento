"use client";

import { useMemo, useState } from "react";

type Props = {
  noitesDisponiveis: string[]; // ISO datetimes (meia-noite UTC), uma por noite livre
  onSelecionar: (selecao: { checkin: string; checkout: string; noites: number } | null) => void;
};

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function paraChaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarioHospedagem({ noitesDisponiveis, onSelecionar }: Props) {
  const disponiveisSet = useMemo(
    () => new Set(noitesDisponiveis.map((n) => paraChaveDia(new Date(n)))),
    [noitesDisponiveis]
  );

  const primeiraDisponivel = useMemo(() => {
    if (noitesDisponiveis.length === 0) return new Date();
    return new Date(
      Math.min(...noitesDisponiveis.map((n) => new Date(n).getTime()))
    );
  }, [noitesDisponiveis]);

  const [mesAtual, setMesAtual] = useState(
    new Date(Date.UTC(primeiraDisponivel.getUTCFullYear(), primeiraDisponivel.getUTCMonth(), 1))
  );
  const [checkin, setCheckin] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const hojeChave = paraChaveDia(new Date());

  function todasNoitesLivres(deChave: string, ateChave: string) {
    const de = new Date(`${deChave}T00:00:00.000Z`);
    const ate = new Date(`${ateChave}T00:00:00.000Z`);
    const cursor = new Date(de);
    while (cursor < ate) {
      if (!disponiveisSet.has(paraChaveDia(cursor))) return false;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return true;
  }

  function clicarDia(chave: string) {
    setErro("");

    if (!disponiveisSet.has(chave)) return;

    if (!checkin || checkout) {
      setCheckin(chave);
      setCheckout(null);
      onSelecionar(null);
      return;
    }

    if (chave <= checkin) {
      setCheckin(chave);
      return;
    }

    if (!todasNoitesLivres(checkin, chave)) {
      setErro("Tem dia indisponível nesse período. Escolha outro intervalo.");
      setCheckin(chave);
      setCheckout(null);
      onSelecionar(null);
      return;
    }

    const noites = Math.round(
      (new Date(`${chave}T00:00:00.000Z`).getTime() -
        new Date(`${checkin}T00:00:00.000Z`).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    setCheckout(chave);
    onSelecionar({ checkin, checkout: chave, noites });
  }

  const primeiroDiaMes = new Date(Date.UTC(mesAtual.getUTCFullYear(), mesAtual.getUTCMonth(), 1));
  const ultimoDiaMes = new Date(Date.UTC(mesAtual.getUTCFullYear(), mesAtual.getUTCMonth() + 1, 0));
  const offsetInicial = primeiroDiaMes.getUTCDay();

  const celulas: (string | null)[] = [];
  for (let i = 0; i < offsetInicial; i++) celulas.push(null);
  for (let dia = 1; dia <= ultimoDiaMes.getUTCDate(); dia++) {
    celulas.push(paraChaveDia(new Date(Date.UTC(mesAtual.getUTCFullYear(), mesAtual.getUTCMonth(), dia))));
  }

  function mudarMes(delta: number) {
    setMesAtual((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + delta, 1)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => mudarMes(-1)} className="text-neutral-400 px-2">
          ‹
        </button>
        <span className="text-xs font-medium">
          {MESES[mesAtual.getUTCMonth()]} {mesAtual.getUTCFullYear()}
        </span>
        <button type="button" onClick={() => mudarMes(1)} className="text-neutral-400 px-2">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-[10px] text-neutral-400 py-1">
            {d}
          </div>
        ))}

        {celulas.map((chave, i) => {
          if (!chave) return <div key={i} />;

          const disponivel = disponiveisSet.has(chave) && chave >= hojeChave;
          const noRange =
            checkin && checkout && chave >= checkin && chave < checkout;
          const eExtremo = chave === checkin || chave === checkout;

          return (
            <button
              key={i}
              type="button"
              disabled={!disponivel}
              onClick={() => clicarDia(chave)}
              className={`text-xs rounded-lg py-1.5 ${
                eExtremo
                  ? "bg-verdog text-white font-medium"
                  : noRange
                  ? "bg-verdog-pale text-verdog-dark"
                  : disponivel
                  ? "text-neutral-700 hover:bg-verdog-pale"
                  : "text-neutral-300"
              }`}
            >
              {parseInt(chave.slice(8, 10), 10)}
            </button>
          );
        })}
      </div>

      {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

      <div className="text-xs text-neutral-500 mt-2">
        {checkin && !checkout && "Agora escolha a data de check-out."}
        {checkin && checkout && (
          <>
            {new Date(`${checkin}T00:00:00.000Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
            {" → "}
            {new Date(`${checkout}T00:00:00.000Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
          </>
        )}
        {!checkin && "Escolha a data de check-in."}
      </div>
    </div>
  );
}
