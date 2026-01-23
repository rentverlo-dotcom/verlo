"use client";

type Match = {
  id: string;
  title: string;
  address: string;
  price: number;
  cover_url: string;
};

export default function MatchCard({
  match,
  onLike,
  onSkip,
}: {
  match: Match;
  onLike: (id: string) => void;
  onSkip: (id: string) => void;
}) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      <img
        src={match.cover_url}
        alt={match.title}
        className="w-full h-56 object-cover"
      />

      <div className="p-4">
        <h2 className="text-xl font-semibold">{match.title}</h2>
        <p className="text-gray-500">{match.address}</p>

        <p className="text-lg font-bold mt-2">
          ${match.price.toLocaleString()} / mes
        </p>

        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={() => onSkip(match.id)}
            className="w-full py-3 rounded-xl border border-gray-300 text-gray-600"
          >
            ❌ No me interesa
          </button>

          <button
            onClick={() => onLike(match.id)}
            className="w-full py-3 rounded-xl bg-blue-600 text-white"
          >
            ❤️ Me interesa
          </button>
        </div>
      </div>
    </div>
  );
}
