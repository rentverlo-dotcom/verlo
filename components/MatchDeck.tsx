"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  // EMPTY STATE LINDO
  if (!current) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-center text-gray-300 px-6">
        <h2 className="text-3xl font-semibold mb-3">
          Eso es todo por ahora ✨
        </h2>
        <p className="text-gray-400 max-w-md mb-6">
          Estamos buscando nuevas propiedades que encajen con vos.
          Volvé más tarde o ajustá tus preferencias.
        </p>

        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      {/* CARD */}
      <div
        className="relative w-full max-w-md h-[70vh] max-h-[640px] rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
        onClick={() => router.push(`/properties/${current.id}`)}
      >
        {/* IMAGE */}
        <img
          src={current.cover_url}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* INFO */}
        <div className="absolute bottom-6 left-5 right-5">
          <h2 className="text-2xl font-semibold leading-tight">
            {current.title}
          </h2>
          <p className="text-sm text-gray-300 mt-1">{current.address}</p>
          <p className="text-xl font-bold mt-2">
            ${current.price.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex gap-8">
        <button
          onClick={next}
          className="w-14 h-14 rounded-full bg-gray-800 text-white text-xl flex items-center justify-center hover:bg-gray-700 transition"
          aria-label="No me interesa"
        >
          ✕
        </button>

        <button
          onClick={() => {
            // acá después guardamos el like
            next();
          }}
          className="w-16 h-16 rounded-full bg-rose-600 text-white text-2xl flex items-center justify-center hover:bg-rose-500 transition"
          aria-label="Me interesa"
        >
          ❤
        </button>
      </div>
    </div>
  );
}
