"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Match = {
  id: string;
  title: string;
  address: string;
  price: number;
  cover_url: string;
};

export default function MatchDeck({ matches }: { matches: Match[] }) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const current = matches[index];

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-6">
        <div className="text-center text-white max-w-sm">
          <h2 className="text-2xl font-semibold mb-2">
            Estamos buscando más opciones para vos
          </h2>
          <p className="text-gray-400">
            Volvé en un rato, seguimos cargando propiedades que te pueden
            encantar ✨
          </p>
        </div>
      </div>
    );
  }

  const next = () => setIndex((i) => i + 1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      {/* CONTENEDOR TIPO TELÉFONO */}
      <div className="relative w-[360px] h-[600px] rounded-[28px] overflow-hidden bg-zinc-900 shadow-2xl">
        {/* IMAGEN */}
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* GRADIENTE */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* INFO */}
        <div className="absolute bottom-24 left-4 right-4 text-white">
          <h2 className="text-xl font-semibold leading-tight">
            {current.title}
          </h2>
          <p className="text-sm text-gray-300">{current.address}</p>
          <p className="text-lg font-bold mt-1">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>

        {/* BOTONES */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-10">
          <button
            onClick={next}
            className="w-14 h-14 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-lg active:scale-95"
            aria-label="No me interesa"
          >
            ✕
          </button>

          <button
            onClick={() => {
              // acá después guardamos el like
              next();
            }}
            className="w-16 h-16 rounded-full bg-rose-500 text-white text-2xl flex items-center justify-center shadow-xl active:scale-95"
            aria-label="Me interesa"
          >
            ♥
          </button>
        </div>

        {/* CLICK PARA DETALLE */}
        <button
          onClick={() => router.push(`/properties/${current.id}`)}
          className="absolute inset-0"
          aria-label="Ver detalle"
        />
      </div>
    </div>
  );
}
