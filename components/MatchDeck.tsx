"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Heart } from "lucide-react";

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
      <div className="h-[80vh] flex flex-col items-center justify-center text-center text-white px-6">
        <h2 className="text-2xl font-semibold mb-2">
          🎉 Ya viste todas las propiedades
        </h2>
        <p className="text-sm opacity-70 max-w-sm">
          Estamos cargando nuevas oportunidades para vos.  
          Volvé en un rato y seguí encontrando tu próximo hogar.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-black text-white">
      {/* CARD */}
      <div
        onClick={() => router.push(`/properties/${current.id}`)}
        className="relative w-[360px] h-[520px] rounded-2xl overflow-hidden shadow-2xl cursor-pointer select-none"
      >
        {/* Imagen */}
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-xl font-semibold leading-tight">
            {current.title}
          </h2>
          <p className="text-sm opacity-80">{current.address}</p>
          <p className="text-lg font-bold mt-1">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex items-center gap-10">
        <button
          onClick={next}
          className="w-14 h-14 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
          aria-label="No me interesa"
        >
          <X size={26} className="text-red-400" />
        </button>

        <button
          onClick={() => {
            // TODO: guardar like en Supabase
            next();
          }}
          className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center transition"
          aria-label="Me interesa"
        >
          <Heart size={28} className="text-white fill-white" />
        </button>
      </div>
    </div>
  );
}
