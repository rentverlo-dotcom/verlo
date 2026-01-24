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
      <div className="h-screen flex items-center justify-center text-white bg-black">
        No hay más propiedades
      </div>
    );
  }

  const next = () => setIndex((i) => i + 1);

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="relative w-[360px] h-[640px] rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-24 left-4 right-4 text-white">
          <h2 className="text-2xl font-bold">{current.title}</h2>
          <p className="text-sm opacity-80">{current.address}</p>
          <p className="text-xl font-semibold mt-1">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
          <button
            onClick={next}
            className="w-14 h-14 rounded-full bg-gray-700 text-xl"
          >
            ❌
          </button>

          <button
            onClick={() => {
              next();
            }}
            className="w-16 h-16 rounded-full bg-emerald-500 text-2xl"
          >
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
}

