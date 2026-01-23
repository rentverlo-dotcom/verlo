"use client";

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
  return (
    <div className="flex justify-center items-center h-[80vh]">
      {matches.map((match) => (
        <TinderCard
          key={match.id}
          preventSwipe={["up", "down"]}
          onSwipe={(dir) => console.log(dir, match.id)}
        >
          <div className="absolute">
            <MatchCard match={match} />
          </div>
        </TinderCard>
      ))}
    </div>
  );
}
