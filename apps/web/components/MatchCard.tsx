"use client";

type Match = {
  id: string;
  title: string;
  address: string;
  price: number;
  cover_url: string;
};

export default function MatchCard({ match }: { match: Match }) {
  return (
    <div className="w-[320px] h-[420px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
      <img
        src={match.cover_url}
        alt={match.title}
        className="h-56 w-full object-cover"
      />

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold">{match.title}</h2>
          <p className="text-sm text-gray-500">{match.address}</p>
        </div>

        <div className="text-xl font-semibold">
          ${match.price.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

