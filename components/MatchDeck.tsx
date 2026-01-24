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
      <div className="h-screen flex items-center justify-center bg-black text-white text-xl">
        No hay más propiedades 🎉
      </div>
    );
  }

  const next = () => setIndex((i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {/* CARD */}
      <div
        className="relative w-[92vw] max-w-[420px] h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
        onClick={() => router.push(`/properties/${current.id}`)}
      >
        {/* IMAGE */}
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* INFO */}
        <div className="absolute bottom-24 left-4 right-4 text-white">
          <h2 className="text-2xl font-bold leading-tight">
            {current.title}
          </h2>
          <p className="text-sm opacity-80">{current.address}</p>
          <p className="text-xl font-semibold mt-1">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="absolute bottom-8 flex gap-10">
        <button
          onClick={next}
          className="w-16 h-16 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-xl"
        >
          ❌
        </button>

        <button
          onClick={next}
          className="w-20 h-20 rounded-full bg-emerald-500 text-white text-3xl flex items-center justify-center shadow-xl"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
