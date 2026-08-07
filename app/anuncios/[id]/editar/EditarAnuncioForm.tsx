"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { comprimirImagem } from "@/lib/imagem";

const TIPO_LABEL: Record<string, string> = {
  PASSEIO: "Passeio",
  ADESTRAMENTO: "Adestramento",
  HOSPEDAGEM: "Hospedagem",
};

const ZONAS = [
  { valor: "NORTE", label: "Zona Norte" },
  { valor: "SUL", label: "Zona Sul" },
  { valor: "LESTE", label: "Zona Leste" },
  { valor: "OESTE", label: "Zona Oeste" },
  { valor: "CENTRO", label: "Centro" },
] as const;

type Zona = (typeof ZONAS)[number]["valor"];

type SlotPontual = { data: string; horario: string };
type SlotHospedagem = { checkin: string; checkout: string };

const MAX_FOTOS = 8;

function formatarData(dataStr: string) {
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDisponibilidade(
  d: { inicio: string; fim: string },
  ehHospedagem: boolean
) {
  const inicio = new Date(d.inicio);
  if (ehHospedagem) {
    return inicio.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }
  return `${inicio.toLocaleDateString("pt-BR")} às ${inicio.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

type Anuncio = {
  id: string;
  tipoServico: "PASSEIO" | "ADESTRAMENTO" | "HOSPEDAGEM";
  titulo: string;
  descricao: string;
  preco: number;
  local: string;
  zona: string;
  localHospedagem: string | null;
  fotos: { id: string; url: string }[];
  disponibilidades: { id: string; inicio: string; fim: string }[];
};

export default function EditarAnuncioForm({ anuncio }: { anuncio: Anuncio }) {
  const router = useRouter();
  const ehHospedagem = anuncio.tipoServico === "HOSPEDAGEM";

  const [titulo, setTitulo] = useState(anuncio.titulo);
  const [descricao, setDescricao] = useState(anuncio.descricao);
  const [preco, setPreco] = useState(String(anuncio.preco));
  const [local, setLocal] = useState(anuncio.local);
  const [zona, setZona] = useState<Zona>(anuncio.zona as Zona);
  const [localHospedagem, setLocalHospedagem] = useState(anuncio.localHospedagem ?? "");

  const [fotosExistentes, setFotosExistentes] = useState(anuncio.fotos);
  const [fotosRemovidas, setFotosRemovidas] = useState<string[]>([]);
  const [fotosNovas, setFotosNovas] = useState<string[]>([]);
  const [processandoFotos, setProcessandoFotos] = useState(false);

  const [disponibilidadesExistentes, setDisponibilidadesExistentes] = useState(
    anuncio.disponibilidades
  );
  const [disponibilidadesRemovidas, setDisponibilidadesRemovidas] = useState<string[]>([]);

  function removerDisponibilidadeExistente(id: string) {
    setDisponibilidadesExistentes((d) => d.filter((disp) => disp.id !== id));
    setDisponibilidadesRemovidas((r) => [...r, id]);
  }

  const [slotsPontuaisNovos, setSlotsPontuaisNovos] = useState<SlotPontual[]>([]);
  const [slotsHospedagemNovos, setSlotsHospedagemNovos] = useState<SlotHospedagem[]>([]);
  const [novaData, setNovaData] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [novoCheckin, setNovoCheckin] = useState("");
  const [novoCheckout, setNovoCheckout] = useState("");

  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const totalFotos = fotosExistentes.length + fotosNovas.length;

  function removerFotoExistente(id: string) {
    setFotosExistentes((f) => f.filter((foto) => foto.id !== id));
    setFotosRemovidas((r) => [...r, id]);
  }

  function removerFotoNova(idx: number) {
    setFotosNovas((f) => f.filter((_, i) => i !== idx));
  }

  async function handleFotosSelecionadas(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (arquivos.length === 0) return;

    const espaco = MAX_FOTOS - totalFotos;
    if (espaco <= 0) return;

    setProcessandoFotos(true);
    const selecionados = arquivos.slice(0, espaco);
    const comprimidas = await Promise.all(
      selecionados.map((a) => comprimirImagem(a).catch(() => null))
    );
    setFotosNovas((f) => [...f, ...comprimidas.filter((c): c is string => !!c)]);
    setProcessandoFotos(false);
  }

  function adicionarSlotPontual() {
    if (!novaData || !novoHorario) return;
    setSlotsPontuaisNovos((s) => [...s, { data: novaData, horario: novoHorario }]);
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
    setSlotsHospedagemNovos((s) => [...s, { checkin: novoCheckin, checkout: novoCheckout }]);
    setNovoCheckin("");
    setNovoCheckout("");
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
    if (ehHospedagem && !localHospedagem.trim()) {
      setErro("Informe onde é a hospedagem.");
      return;
    }
    if (totalFotos === 0) {
      setErro("O anúncio precisa de pelo menos uma foto.");
      return;
    }

    const novasDisponibilidades = ehHospedagem
      ? slotsHospedagemNovos.map((s) => ({ inicio: s.checkin, fim: s.checkout }))
      : slotsPontuaisNovos.map((s) => {
          const inicio = new Date(`${s.data}T${s.horario}:00`);
          const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
          return { inicio: inicio.toISOString(), fim: fim.toISOString() };
        });

    setEnviando(true);
    const res = await fetch(`/api/anuncios/${anuncio.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descricao,
        preco,
        local,
        zona,
        localHospedagem: ehHospedagem ? localHospedagem : undefined,
        novasDisponibilidades,
        novasFotos: fotosNovas,
        fotosParaRemover: fotosRemovidas,
        disponibilidadesParaRemover: disponibilidadesRemovidas,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setEnviando(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível salvar as alterações.");
      return;
    }

    setSalvo(true);
    setTimeout(() => {
      router.push("/meus-anuncios");
      router.refresh();
    }, 1200);
  }

  if (salvo) {
    return (
      <div className="px-4 pt-6">
        <div className="border border-verdog-pale bg-verdog-pale text-verdog-dark text-sm rounded-2xl p-4">
          Alterações salvas!
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pt-4 pb-8">
      <div className="bg-verdog-pale text-verdog-dark text-xs font-medium rounded-xl px-3 py-2.5 w-fit">
        {TIPO_LABEL[anuncio.tipoServico]}
      </div>

      <label className="text-xs text-neutral-600">
        Título
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
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
        Preço (R$){ehHospedagem ? " por diária" : ""}
        <input
          type="number"
          min="0"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-full mt-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm"
        />
      </label>

      {ehHospedagem && (
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
          {ehHospedagem ? "Períodos disponíveis" : "Horários disponíveis"}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          Os que já foram reservados por um cliente não aparecem aqui e não
          podem ser removidos. Os outros você pode tirar ou deixar como está.
        </p>

        {disponibilidadesExistentes.length > 0 && (
          <ul className="flex flex-col gap-1.5 mt-3">
            {disponibilidadesExistentes.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between text-xs bg-neutral-50 text-neutral-600 rounded-lg px-3 py-2"
              >
                <span>
                  {formatarDisponibilidade(d, ehHospedagem)}
                  {ehHospedagem && " (noite)"}
                </span>
                <button
                  type="button"
                  onClick={() => removerDisponibilidadeExistente(d.id)}
                  className="text-neutral-400"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {ehHospedagem ? (
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
          {ehHospedagem
            ? slotsHospedagemNovos.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs bg-verdog-pale text-verdog-dark rounded-lg px-3 py-2"
                >
                  <span>
                    {formatarData(s.checkin)} → {formatarData(s.checkout)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlotsHospedagemNovos((arr) => arr.filter((_, x) => x !== i))}
                    className="text-verdog-dark"
                  >
                    ×
                  </button>
                </li>
              ))
            : slotsPontuaisNovos.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-xs bg-verdog-pale text-verdog-dark rounded-lg px-3 py-2"
                >
                  <span>
                    {formatarData(s.data)} às {s.horario}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlotsPontuaisNovos((arr) => arr.filter((_, x) => x !== i))}
                    className="text-verdog-dark"
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
          {fotosExistentes.map((f) => (
            <div key={f.id} className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removerFotoExistente(f.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-5 text-center"
              >
                ×
              </button>
            </div>
          ))}
          {fotosNovas.map((f, i) => (
            <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removerFotoNova(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-5 text-center"
              >
                ×
              </button>
            </div>
          ))}

          {totalFotos < MAX_FOTOS && (
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
        {enviando ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
