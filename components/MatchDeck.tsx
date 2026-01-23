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
      <div className="h-screen flex items-center justify-center text-white">
        No hay más propiedades 🎉
      </div>
    );
  }

  const next = () => setIndex((i) => i + 1);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      {/* CARD */}
      <div
        className="relative w-full max-w-md h-[85vh] rounded-2xl overflow-hidden shadow-xl cursor-pointer"
        onClick={() => router.push(`/properties/${current.id}`)}
      >
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Info */}
        <div className="absolute bottom-20 left-4 right-4">
          <h2 className="text-xl font-bold">{current.title}</h2>
          <p className="text-sm opacity-80">{current.address}</p>
          <p className="text-lg font-semibold mt-1">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex gap-6">
        <button
          onClick={next}
          className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-xl"
        >
          ❌
        </button>

        <button
          onClick={() => {
            // acá después guardamos el like
            next();
          }}
          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-2xl"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
