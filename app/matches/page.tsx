"use client";

import { useEffect, useState } from "react";
import MatchDeck from "@/components/MatchDeck";

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties/feed")
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="p-8">Cargando propiedades…</p>;
  }

  return (
    <main className="bg-gray-100 min-h-screen">
      <MatchDeck matches={matches} />
    </main>
  );
}
