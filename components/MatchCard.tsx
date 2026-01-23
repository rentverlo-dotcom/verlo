"use client";

import TinderCard from "react-tinder-card";

type Match = {
  id: string;
  price: number;
  zone: string;
  cover: string;
  highlights: string[];
};

export default function MatchCard({
  match,
  onLike,
  onReject,
}: {
  match: Match;
  onLike: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <TinderCard
      key={match.id}
      onSwipe={(dir) => {
        if (dir === "right") onLike(match.id);
        if (dir === "left") onReject(match.id);
      }}
      preventSwipe={["up", "down"]}
    >
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-[90vw] max-w-md mx-auto">
        <img
          src={match.cover}
          alt="Property"
          className="h-64 w-full object-cover"
        />

        <div className="p-4">
          <h2 className="text-2xl font-bold">${match.price}</h2>
          <p className="text-gray-600">{match.zone}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {match.highlights.map((h) => (
              <span
                key={h}
                className="bg-gray-100 text-sm px-3 py-1 rounded-full"
              >
                {h}
              </span>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => onReject(match.id)}
              className="text-red-500 text-lg"
            >
              ❌ Paso
            </button>
            <button
              onClick={() => onLike(match.id)}
              className="text-green-600 text-lg"
            >
              ❤️ Me interesa
            </button>
          </div>
        </div>
      </div>
    </TinderCard>
  );
}
