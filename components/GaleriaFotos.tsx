"use client";

import { useRef, useState } from "react";

type Foto = { id: string; url: string };

export default function GaleriaFotos({ fotos, titulo }: { fotos: Foto[]; titulo: string }) {
  const [indice, setIndice] = useState(0);
  const inicioToque = useRef<number | null>(null);

  if (fotos.length === 0) {
    return <div className="w-full aspect-square bg-verdog-light" />;
  }

  function irPara(i: number) {
    setIndice(Math.max(0, Math.min(fotos.length - 1, i)));
  }

  function handleTouchStart(e: React.TouchEvent) {
    inicioToque.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (inicioToque.current === null) return;
    const delta = e.changedTouches[0].clientX - inicioToque.current;
    inicioToque.current = null;
    if (Math.abs(delta) < 40) return;
    irPara(delta > 0 ? indice - 1 : indice + 1);
  }

  return (
    <div>
      <div
        className="relative w-full aspect-square bg-verdog-light overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[indice].url}
          alt={titulo}
          className="w-full h-full object-cover"
        />

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => irPara(indice - 1)}
              disabled={indice === 0}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-0"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => irPara(indice + 1)}
              disabled={indice === fotos.length - 1}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-0"
            >
              ›
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {fotos.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === indice ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {fotos.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => irPara(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${
                i === indice ? "ring-2 ring-verdog" : "opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
