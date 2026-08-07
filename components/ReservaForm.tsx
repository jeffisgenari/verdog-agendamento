"use client";

import { useState } from "react";
import Link from "next/link";
import CalendarioHospedagem from "@/components/CalendarioHospedagem";

type Disponibilidade = { id: string; inicio: string; fim: string };

type Props = {
  anuncioId: string;
  preco: number;
  tipoServico: "PASSEIO" | "ADESTRAMENTO" | "HOSPEDAGEM";
  disponibilidades: Disponibilidade[];
  noitesDisponiveis: string[];
  usuarioLogado: { nome: string | null; telefone: string | null } | null;
  loginUrl: string;
};

function formatarOpcao(d: Disponibilidade) {
  const inicio = new Date(d.inicio);
  return `${inicio.toLocaleDateString("pt-BR")} às ${inicio.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function ReservaForm({
  anuncioId,
  preco,
  tipoServico,
  disponibilidades,
  noitesDisponiveis,
  usuarioLogado,
  loginUrl,
}: Props) {
  const ehHospedagem = tipoServico === "HOSPEDAGEM";

  const [disponibilidadeId, setDisponibilidadeId] = useState(disponibilidades[0]?.id ?? "");
  const [selecaoHospedagem, setSelecaoHospedagem] = useState<{
    checkin: string;
    checkout: string;
    noites: number;
  } | null>(null);
  const [nome, setNome] = useState(usuarioLogado?.nome ?? "");
  const [contato, setContato] = useState(usuarioLogado?.telefone ?? "");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const total = ehHospedagem ? (selecaoHospedagem?.noites ?? 0) * preco : preco;

  async function confirmar() {
    setMensagem(null);

    if (ehHospedagem && !selecaoHospedagem) {
      setMensagem("Escolha o check-in e o check-out no calendário.");
      return;
    }
    if (!ehHospedagem && !disponibilidadeId) {
      setMensagem("Escolha o dia e o horário.");
      return;
    }
    if (!nome || !contato) {
      setMensagem("Preencha seu nome e contato.");
      return;
    }

    setEnviando(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        ehHospedagem
          ? {
              anuncioId,
              checkin: selecaoHospedagem!.checkin,
              checkout: selecaoHospedagem!.checkout,
              clienteNome: nome,
              clienteContato: contato,
            }
          : {
              anuncioId,
              disponibilidadeId,
              clienteNome: nome,
              clienteContato: contato,
            }
      ),
    });
    const json = await res.json();
    setEnviando(false);

    if (!res.ok) {
      setMensagem(json.erro || "Não foi possível agendar. Escolha outro horário.");
      return;
    }

    // TODO: redirecionar para a tela/checkout do Pagar.me usando o
    // agendamentoId retornado (json.agendamentoId)
    setConfirmado(true);
    setMensagem("Agendamento criado! Redirecionando para o pagamento...");
  }

  if (!usuarioLogado) {
    return (
      <div className="px-4 py-4 border-t border-neutral-100 flex flex-col gap-2">
        <p className="text-sm text-neutral-600">
          Entre na sua conta para reservar.
        </p>
        <Link
          href={loginUrl}
          className="bg-verdog text-white text-sm font-medium rounded-lg py-3 text-center"
        >
          Entrar para reservar
        </Link>
      </div>
    );
  }

  if (ehHospedagem && noitesDisponiveis.length === 0) {
    return (
      <div className="px-4 py-4 border-t border-neutral-100">
        <p className="text-sm text-neutral-500">
          Nenhuma diária disponível no momento.
        </p>
      </div>
    );
  }
  if (!ehHospedagem && disponibilidades.length === 0) {
    return (
      <div className="px-4 py-4 border-t border-neutral-100">
        <p className="text-sm text-neutral-500">
          Nenhum horário disponível no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-neutral-100 flex flex-col gap-3">
      {ehHospedagem ? (
        <CalendarioHospedagem
          noitesDisponiveis={noitesDisponiveis}
          onSelecionar={(s) => {
            setSelecaoHospedagem(s);
            setMensagem(null);
          }}
        />
      ) : (
        <label className="text-xs text-neutral-600">
          Dia e horário
          <select
            value={disponibilidadeId}
            onChange={(e) => setDisponibilidadeId(e.target.value)}
            disabled={confirmado}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          >
            {disponibilidades.map((d) => (
              <option key={d.id} value={d.id}>
                {formatarOpcao(d)}
              </option>
            ))}
          </select>
        </label>
      )}

      <input
        placeholder="Seu nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        disabled={confirmado}
        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />
      <input
        placeholder="Telefone (WhatsApp)"
        value={contato}
        onChange={(e) => setContato(e.target.value)}
        disabled={confirmado}
        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />

      {mensagem && <p className="text-xs text-neutral-600">{mensagem}</p>}

      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="text-[11px] text-neutral-500">
            Total{ehHospedagem && selecaoHospedagem ? ` (${selecaoHospedagem.noites} diária${selecaoHospedagem.noites > 1 ? "s" : ""})` : ""}
          </div>
          <div className="text-base font-medium">R$ {total.toFixed(0)}</div>
        </div>
        <button
          onClick={confirmar}
          disabled={enviando || confirmado}
          className="bg-verdog text-white text-sm font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Confirmar e pagar"}
        </button>
      </div>
    </div>
  );
}
