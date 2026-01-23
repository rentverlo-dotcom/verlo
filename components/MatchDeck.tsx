"use client";

import { useState } from "react";
import TinderCard from "react-tinder-card";
import MatchCard from "./MatchCard";

type Match = {
  id: string;
  title: string;
  address: string;
  price: number;
  cover_url: string;
};

export default function MatchDeck({ matches }: { matches: Match[] }) {
  const [selected, setSelected] = useState<Match | null>(null);

  const onSwipe = (dir: string, match: Match) => {
  if (dir === "right") {
  setSelected(match);

  fetch("/api/likes/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: "00000000-0000-0000-0000-000000000001", // mock
      property_id: match.id,
    }),
  });
    fetch("/api/matches/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tenant_id: "00000000-0000-0000-0000-000000000001", // mock
    property_id: match.id,
  }),
});

}

  };

  return (
    <div className="relative flex justify-center items-center h-[80vh]">
      {matches.map((match) => (
        <TinderCard
          key={match.id}
          preventSwipe={["up", "down"]}
          onSwipe={(dir) => onSwipe(dir, match)}
        >
          <div className="absolute">
            <MatchCard match={match} />
          </div>
        </TinderCard>
      ))}

      {selected && (
        <div className="absolute bottom-10 bg-white p-4 rounded-xl shadow-lg">
          <a
            href={`https://wa.me/5491111111111?text=${encodeURIComponent(
              `Hola! Me interesa esta propiedad:\n\n${selected.title}\n${selected.address}\nPrecio: $${selected.price}`
            )}`}
            target="_blank"
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Quiero visitar
          </a>
        </div>
      )}
    </div>
  );
}
