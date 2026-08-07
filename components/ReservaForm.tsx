"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CalendarioHospedagem from "@/components/CalendarioHospedagem";
import { formatarCpf, cpfValido } from "@/lib/cpf";

type Disponibilidade = { id: string; inicio: string; fim: string };

type Props = {
  anuncioId: string;
  preco: number;
  tipoServico: "PASSEIO" | "ADESTRAMENTO" | "HOSPEDAGEM";
  disponibilidades: Disponibilidade[];
  noitesDisponiveis: string[];
  usuarioLogado: { nome: string | null; telefone: string | null; cpf: string | null } | null;
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
  const [cpf, setCpf] = useState(usuarioLogado?.cpf ? formatarCpf(usuarioLogado.cpf) : "");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeUrl: string; expiraEm: string } | null>(null);
  const [statusAgendamento, setStatusAgendamento] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const total = ehHospedagem ? (selecaoHospedagem?.noites ?? 0) * preco : preco;

  useEffect(() => {
    if (!agendamentoId || !pix || statusAgendamento) return;

    const intervalo = setInterval(async () => {
      const res = await fetch(`/api/agendamentos/${agendamentoId}/status`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.status && json.status !== "AGUARDANDO_PAGAMENTO") {
        setStatusAgendamento(json.status);
      }
    }, 4000);

    return () => clearInterval(intervalo);
  }, [agendamentoId, pix, statusAgendamento]);

  async function copiarCodigoPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Alguns navegadores recusam a Clipboard API fora de certos
      // contextos — o código continua selecionável/copiável na mão.
    }
  }

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
    if (!cpfValido(cpf)) {
      setMensagem("Informe um CPF válido — é exigido pra gerar a cobrança Pix.");
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
              clienteCpf: cpf,
            }
          : {
              anuncioId,
              disponibilidadeId,
              clienteNome: nome,
              clienteContato: contato,
              clienteCpf: cpf,
            }
      ),
    });
    const json = await res.json();
    setEnviando(false);

    if (!res.ok) {
      setMensagem(json.erro || "Não foi possível agendar. Escolha outro horário.");
      return;
    }

    setAgendamentoId(json.agendamentoId);
    setPix(json.pix);
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
            disabled={!!pix}
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
        name="name"
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        disabled={!!pix}
        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />
      <input
        placeholder="Telefone (WhatsApp)"
        name="tel"
        autoComplete="tel"
        value={contato}
        onChange={(e) => setContato(e.target.value)}
        disabled={!!pix}
        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />
      <input
        placeholder="CPF"
        name="cpf"
        value={cpf}
        onChange={(e) => setCpf(formatarCpf(e.target.value))}
        disabled={!!pix}
        inputMode="numeric"
        maxLength={14}
        className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
      />

      {mensagem && <p className="text-xs text-neutral-600">{mensagem}</p>}

      {pix && statusAgendamento === "CONFIRMADO" && (
        <div className="flex flex-col items-center text-center gap-2 py-4">
          <div className="w-12 h-12 rounded-full bg-verdog-pale text-verdog flex items-center justify-center text-2xl">
            ✓
          </div>
          <p className="text-sm font-medium">Pagamento confirmado!</p>
          <p className="text-xs text-neutral-500">Sua reserva está confirmada.</p>
        </div>
      )}

      {pix && statusAgendamento === "CANCELADO" && (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <p className="text-sm text-neutral-600">
            Não recebemos o pagamento a tempo e o horário foi liberado.
          </p>
          <button
            type="button"
            onClick={() => {
              setPix(null);
              setAgendamentoId(null);
              setStatusAgendamento(null);
              setMensagem(null);
            }}
            className="bg-verdog text-white text-sm font-medium rounded-lg px-5 py-2.5"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {pix && !statusAgendamento && (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm font-medium">Pague com Pix pra confirmar</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.qrCodeUrl} alt="QR Code Pix" className="w-48 h-48" />
          <div className="w-full flex flex-col gap-1">
            <button
              type="button"
              onClick={copiarCodigoPix}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-[11px] text-neutral-600 break-all text-left"
            >
              {pix.qrCode}
            </button>
            <span className="text-[11px] text-verdog text-center">
              {copiado ? "Código copiado!" : "Clique para copiar"}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 text-center">
            Abra o app do seu banco, escolha pagar com Pix e escaneie o QR
            Code ou cole o código copiado acima.
          </p>
          <p className="text-xs text-neutral-500">Aguardando confirmação do pagamento...</p>
        </div>
      )}

      {!pix && (
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-[11px] text-neutral-500">
              Total{ehHospedagem && selecaoHospedagem ? ` (${selecaoHospedagem.noites} diária${selecaoHospedagem.noites > 1 ? "s" : ""})` : ""}
            </div>
            <div className="text-base font-medium">R$ {total.toFixed(0)}</div>
          </div>
          <button
            onClick={confirmar}
            disabled={enviando}
            className="bg-verdog text-white text-sm font-medium rounded-lg px-5 py-2.5 disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Confirmar e pagar"}
          </button>
        </div>
      )}
    </div>
  );
}
