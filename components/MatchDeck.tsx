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
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white text-center">
        <h2 className="text-2xl font-semibold mb-2">Eso es todo… por ahora 👀</h2>
        <p className="text-white/60">
          Estamos buscando nuevas propiedades para vos.
        </p>
      </div>
    );
  }

  const next = () => setIndex((i) => i + 1);

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="relative w-[360px] h-[640px] rounded-3xl overflow-hidden shadow-2xl">
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
          <h2 className="text-xl font-bold">{current.title}</h2>
          <p className="text-sm opacity-80">{current.address}</p>
          <p className="text-lg font-semibold mt-1">
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
              // like futuro
              next();
            }}
            className="w-16 h-16 rounded-full bg-rose-500 text-white text-2xl flex items-center justify-center shadow-xl active:scale-95"
          >
            ♥
          </button>
        </div>

        {/* CLICK TO OPEN */}
        <button
          onClick={() => router.push(`/properties/${current.id}`)}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
