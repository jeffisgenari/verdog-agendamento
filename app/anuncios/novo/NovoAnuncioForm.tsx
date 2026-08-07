"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { comprimirImagem } from "@/lib/imagem";

const TIPOS = [
  { valor: "PASSEIO", label: "Passeio" },
  { valor: "ADESTRAMENTO", label: "Adestramento" },
  { valor: "HOSPEDAGEM", label: "Hospedagem" },
] as const;

const ZONAS = [
  { valor: "NORTE", label: "Zona Norte" },
  { valor: "SUL", label: "Zona Sul" },
  { valor: "LESTE", label: "Zona Leste" },
  { valor: "OESTE", label: "Zona Oeste" },
  { valor: "CENTRO", label: "Centro" },
] as const;

type TipoServico = (typeof TIPOS)[number]["valor"];
type Zona = (typeof ZONAS)[number]["valor"];

type SlotPontual = { data: string; horario: string };
type SlotHospedagem = { checkin: string; checkout: string };

const MAX_FOTOS = 8;

function formatarData(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function NovoAnuncioForm() {
  const router = useRouter();
  const [tipoServico, setTipoServico] = useState<TipoServico>("PASSEIO");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [local, setLocal] = useState("");
  const [zona, setZona] = useState<Zona>("CENTRO");
  const [localHospedagem, setLocalHospedagem] = useState("");

  const [slotsPontuais, setSlotsPontuais] = useState<SlotPontual[]>([]);
  const [slotsHospedagem, setSlotsHospedagem] = useState<SlotHospedagem[]>([]);
  const [novaData, setNovaData] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [novoCheckin, setNovoCheckin] = useState("");
  const [novoCheckout, setNovoCheckout] = useState("");

  const [fotos, setFotos] = useState<string[]>([]);
  const [processandoFotos, setProcessandoFotos] = useState(false);

  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function mudarTipo(t: TipoServico) {
    setTipoServico(t);
    setSlotsPontuais([]);
    setSlotsHospedagem([]);
  }

  function adicionarSlotPontual() {
    if (!novaData || !novoHorario) return;
    setSlotsPontuais((s) => [...s, { data: novaData, horario: novoHorario }]);
    setNovaData("");
    setNovoHorario("");
  }

  function adicionarSlotHospedagem() {
    if (!novoCheckin || !novoCheckout) return;
    if (novoCheckout <= novoCheckin) {
      setErro("O check-out precisa ser depois do check-in.");
      return;
    }
    setErro("");
    setSlotsHospedagem((s) => [...s, { checkin: novoCheckin, checkout: novoCheckout }]);
    setNovoCheckin("");
    setNovoCheckout("");
  }

  async function handleFotosSelecionadas(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (arquivos.length === 0) return;

    const espaco = MAX_FOTOS - fotos.length;
    if (espaco <= 0) return;

    setProcessandoFotos(true);
    const selecionados = arquivos.slice(0, espaco);
    const comprimidas = await Promise.all(
      selecionados.map((a) => comprimirImagem(a).catch(() => null))
    );
    setFotos((f) => [...f, ...comprimidas.filter((c): c is string => !!c)]);
    setProcessandoFotos(false);
  }

  function removerFoto(idx: number) {
    setFotos((f) => f.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!titulo.trim()) {
      setErro("Informe o título.");
      return;
    }
    if (!descricao.trim()) {
      setErro("Informe a descrição.");
      return;
    }
    if (!preco || Number(preco) <= 0) {
      setErro("Informe um preço válido.");
      return;
    }
    if (!local.trim()) {
      setErro("Informe o local (bairro/cidade).");
      return;
    }
    if (tipoServico === "HOSPEDAGEM" && !localHospedagem.trim()) {
      setErro("Informe onde é a hospedagem.");
      return;
    }
    if (fotos.length === 0) {
      setErro("Adicione pelo menos uma foto.");
      return;
    }

    // Passeio/adestramento: cada slot já é uma opção fechada de reserva.
    // Hospedagem: cada slot é uma JANELA (ex: 15/08 a 30/08) — o servidor
    // expande isso em diárias soltas pro cliente escolher num calendário.
    const disponibilidades =
      tipoServico === "HOSPEDAGEM"
        ? slotsHospedagem.map((s) => ({ inicio: s.checkin, fim: s.checkout }))
        : slotsPontuais.map((s) => {
            const inicio = new Date(`${s.data}T${s.horario}:00`);
            const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
            return { inicio: inicio.toISOString(), fim: fim.toISOString() };
          });

    if (disponibilidades.length === 0) {
      setErro(
        tipoServico === "HOSPEDAGEM"
          ? "Adicione pelo menos um período disponível."
          : "Adicione pelo menos um horário disponível."
      );
      return;
    }

    setEnviando(true);

    const res = await fetch("/api/anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipoServico,
        titulo,
        descricao,
        preco,
        local,
        zona,
        localHospedagem: tipoServico === "HOSPEDAGEM" ? localHospedagem : undefined,
        disponibilidades,
        fotos,
      }),
    });
    const data = await res.json().catch(() => ({}));

    setEnviando(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível criar o anúncio.");
      return;
    }

    setEnviado(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  if (enviado) {
    return (
      <div className="px-4 pt-6">
        <div className="border border-verdog-pale bg-verdog-pale text-verdog-dark text-sm rounded-2xl p-4">
          Anúncio enviado! Ele vai aparecer no site assim que for aprovado.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pt-4 pb-8">
      <div className="grid grid-cols-3 gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => mudarTipo(t.valor)}
            className={`text-xs font-medium rounded-xl py-2.5 ${
              tipoServico === t.valor
                ? "bg-verdog text-white"
                : "bg-verdog-pale text-verdog-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="text-xs text-neutral-600">
        Título
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Passeio de 30 minutos no parque"
          className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs text-neutral-600">
        Descrição
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </label>

      <div className="flex gap-2">
        <label className="flex-1 text-xs text-neutral-600">
          Local (bairro/cidade)
          <input
            type="text"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Ex: Copacabana"
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="w-32 text-xs text-neutral-600">
          Zona
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value as Zona)}
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          >
            {ZONAS.map((z) => (
              <option key={z.valor} value={z.valor}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-xs text-neutral-600">
        Preço (R$){tipoServico === "HOSPEDAGEM" ? " por diária" : ""}
        <input
          type="number"
          min="0"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="0,00"
          className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
        />
      </label>

      {tipoServico === "HOSPEDAGEM" && (
        <label className="text-xs text-neutral-600">
          Onde é a hospedagem
          <input
            type="text"
            value={localHospedagem}
            onChange={(e) => setLocalHospedagem(e.target.value)}
            placeholder="Ex: Minha casa, com quintal cercado"
            className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
      )}

      <div className="border-t border-neutral-100 pt-3 mt-1">
        <div className="text-sm font-medium">
          {tipoServico === "HOSPEDAGEM" ? "Período disponível" : "Horários disponíveis"}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {tipoServico === "HOSPEDAGEM"
            ? "Defina um intervalo — todos os dias dele ficam disponíveis pro cliente escolher check-in/check-out num calendário."
            : "Adicione os dias e horários que você tem livre. Cada um vira uma opção de reserva."}
        </p>

        {tipoServico === "HOSPEDAGEM" ? (
          <div className="flex items-end gap-2 mt-3">
            <label className="flex-1 text-xs text-neutral-600">
              De
              <input
                type="date"
                value={novoCheckin}
                onChange={(e) => setNovoCheckin(e.target.value)}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex-1 text-xs text-neutral-600">
              Até
              <input
                type="date"
                value={novoCheckout}
                onChange={(e) => setNovoCheckout(e.target.value)}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={adicionarSlotHospedagem}
              className="bg-verdog-pale text-verdog-dark text-xs font-medium rounded-lg px-3 py-2"
            >
              Adicionar
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2 mt-3">
            <label className="flex-1 text-xs text-neutral-600">
              Data
              <input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex-1 text-xs text-neutral-600">
              Horário
              <input
                type="time"
                value={novoHorario}
                onChange={(e) => setNovoHorario(e.target.value)}
                className="w-full mt-1 border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={adicionarSlotPontual}
              className="bg-verdog-pale text-verdog-dark text-xs font-medium rounded-lg px-3 py-2"
            >
              Adicionar
            </button>
          </div>
        )}

        <ul className="flex flex-col gap-1.5 mt-3">
          {tipoServico === "HOSPEDAGEM"
            ? slotsHospedagem.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs bg-neutral-50 rounded-lg px-3 py-2"
                >
                  <span>
                    {formatarData(s.checkin)} → {formatarData(s.checkout)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlotsHospedagem((arr) => arr.filter((_, x) => x !== i))}
                    className="text-neutral-400"
                  >
                    ×
                  </button>
                </li>
              ))
            : slotsPontuais.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs bg-neutral-50 rounded-lg px-3 py-2"
                >
                  <span>
                    {formatarData(s.data)} às {s.horario}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlotsPontuais((arr) => arr.filter((_, x) => x !== i))}
                    className="text-neutral-400"
                  >
                    ×
                  </button>
                </li>
              ))}
        </ul>
      </div>

      <div className="border-t border-neutral-100 pt-3 mt-1">
        <div className="text-sm font-medium">Fotos</div>
        <p className="text-xs text-neutral-500 mt-0.5">Pelo menos 1, até {MAX_FOTOS} fotos.</p>

        <div className="grid grid-cols-4 gap-2 mt-3">
          {fotos.map((f, i) => (
            <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removerFoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-5 text-center"
              >
                ×
              </button>
            </div>
          ))}

          {fotos.length < MAX_FOTOS && (
            <label className="w-full aspect-square rounded-lg border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-xs cursor-pointer">
              {processandoFotos ? "..." : "+ foto"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotosSelecionadas}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="bg-verdog text-white text-sm font-medium rounded-lg py-3 mt-2 disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Publicar anúncio"}
      </button>
    </form>
  );
}
