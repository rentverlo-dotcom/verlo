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
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white text-center px-6">
        <h2 className="text-2xl font-semibold mb-2">No hay más propiedades</h2>
        <p className="text-gray-400">
          Volvé más tarde, estamos cargando nuevas oportunidades para vos ✨
        </p>
      </div>
    );
  }

  const next = () => setIndex((i) => i + 1);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black">
      {/* PHONE FRAME */}
      <div className="relative w-[360px] h-[640px] rounded-[32px] overflow-hidden bg-black shadow-2xl">
        {/* IMAGE */}
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

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

        {/* ACTIONS */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={next}
            className="w-14 h-14 rounded-full bg-white/90 text-black text-2xl flex items-center justify-center shadow-lg active:scale-95"
          >
            ✕
          </button>

          <button
            onClick={() => {
              // acá después guardamos el like
              next();
            }}
            className="w-16 h-16 rounded-full bg-rose-500 text-white text-2xl flex items-center justify-center shadow-xl active:scale-95"
          >
            ♥
          </button>
        </div>

        {/* CLICK AREA */}
        <button
          onClick={() => router.push(`/properties/${current.id}`)}
          className="absolute inset-0"
          aria-label="Ver detalle"
        />
      </div>
    </div>
  );
}

