"use client";

import { useState } from "react";
import { motion, PanInfo } from "framer-motion";
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
      <div className="h-screen flex items-center justify-center bg-black text-white">
        No hay más propiedades 🎉
      </div>
    );
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 120 || info.offset.x < -120) {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black">
      {/* PHONE FRAME */}
      <div className="relative w-[390px] h-[820px] rounded-[32px] overflow-hidden bg-black shadow-2xl">
        <motion.div
          key={current.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
          onClick={() => router.push(`/properties/${current.id}`)}
        >
          {/* IMAGE */}
          <img
            src={current.cover_url}
            alt={current.title}
            className="w-full h-full object-cover"
          />

          {/* GRADIENT */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* INFO */}
          <div className="absolute bottom-28 left-5 right-5 text-white">
            <h2 className="text-2xl font-bold leading-tight">
              {current.title}
            </h2>
            <p className="text-sm opacity-80">{current.address}</p>
            <p className="text-xl font-semibold mt-1">
              ${current.price.toLocaleString("es-AR")}
            </p>
          </div>
        </motion.div>

        {/* ACTION BUTTONS */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="w-16 h-16 rounded-full bg-gray-800 text-white text-2xl shadow-lg"
          >
            ✕
          </button>
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="w-20 h-20 rounded-full bg-rose-500 text-white text-3xl shadow-xl"
          >
            ❤
          </button>
        </div>
      </div>
    </div>
  );
}

