"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";

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

  const next = () => setIndex((i) => i + 1);

  if (!current) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white text-center px-6">
        <h2 className="text-2xl font-semibold mb-2">
          🎉 Ya viste todas las propiedades
        </h2>
        <p className="text-white/70">
          Estamos cargando nuevas oportunidades para vos.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      {/* CARD */}
      <div className="w-[380px] h-[640px] rounded-3xl overflow-hidden relative shadow-2xl">
        {/* IMAGE */}
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* INFO */}
        <div className="absolute bottom-24 left-4 right-4">
          <h2 className="text-2xl font-bold">{current.title}</h2>
          <p className="text-sm text-white/80">{current.address}</p>
          <p className="text-xl font-semibold mt-1">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={next}
            className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition"
          >
            <X className="text-black" size={28} />
          </button>

          <button
            onClick={() => {
              // acá después guardamos el like en DB
              next();
            }}
            className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center hover:scale-110 transition"
          >
            <Heart className="text-white fill-white" size={30} />
          </button>
        </div>

        {/* CLICK OVERLAY */}
        <button
          onClick={() => router.push(`/properties/${current.id}`)}
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
