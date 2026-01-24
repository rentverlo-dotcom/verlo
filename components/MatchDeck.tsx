"use client";

import { useRef, useState } from "react";

type Card = {
  id: number;
  name: string;
  age: number;
  image: string;
};

const cards: Card[] = [
  {
    id: 1,
    name: "Nancy",
    age: 22,
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  },
  {
    id: 2,
    name: "Allen",
    age: 18,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
  },
];

export default function MatchDeck() {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const card = cards[index];
  if (!card) return null;

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    setDx(e.clientX - startX.current);
  }

  function onPointerUp() {
    dragging.current = false;

    if (Math.abs(dx) > 120) {
      setIndex((i) => i + 1);
    }
    setDx(0);
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div
        className="relative w-[360px] h-[560px] rounded-2xl overflow-hidden select-none"
        style={{
          transform: `translateX(${dx}px) rotate(${dx * 0.05}deg)`,
          transition: dragging.current ? "none" : "transform 0.3s ease",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* IMAGE */}
        <img
          src={card.image}
          alt={card.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* INFO */}
        <div className="absolute bottom-20 left-4 text-white">
          <div className="text-2xl font-bold">
            {card.name} <span className="font-normal">{card.age}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="absolute bottom-4 w-full flex justify-center gap-6">
          <button className="w-14 h-14 rounded-full bg-white/90 text-red-500 text-xl">
            ✕
          </button>
          <button className="w-16 h-16 rounded-full bg-white text-green-500 text-2xl">
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
