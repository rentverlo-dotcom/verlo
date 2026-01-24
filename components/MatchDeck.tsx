// components/MatchDeck.tsx
"use client";

import { useState } from "react";

type Match = {
  id: string;
  title: string;
  address: string;
  price: number;
  cover_url: string;
};

export default function MatchDeck({ matches }: { matches: Match[] }) {
  const [index, setIndex] = useState(0);

  const handleAction = (dir: "left" | "right" | "super") => {
    setIndex((i) => Math.min(i + 1, matches.length - 1));
  };

  const m = matches[index];
  if (!m) return null;

  return (
    <div className="relative flex flex-col items-center justify-center h-[calc(100vh-64px)]">
      {/* CARD */}
      <div
        className="relative w-[360px] h-[560px] rounded-2xl overflow-hidden shadow-2xl select-none"
        draggable={false}
      >
        <img
          src={m.cover_url}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h2 className="text-3xl font-bold leading-tight">{m.title}</h2>
          <p className="text-sm opacity-80">{m.address}</p>
          <p className="mt-2 text-lg font-semibold">${m.price}</p>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="mt-8 flex gap-6">
        <button
          onClick={() => handleAction("left")}
          className="w-14 h-14 rounded-full bg-white text-red-500 text-2xl shadow-lg active:scale-95"
        >
          ✕
        </button>

        <button
          onClick={() => handleAction("super")}
          className="w-14 h-14 rounded-full bg-white text-blue-500 text-xl shadow-lg active:scale-95"
        >
          ★
        </button>

        <button
          onClick={() => handleAction("right")}
          className="w-16 h-16 rounded-full bg-white text-green-500 text-3xl shadow-xl active:scale-95"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
