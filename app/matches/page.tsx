"use client";

import { useEffect, useState } from "react";
import MatchDeck from "@/components/MatchDeck";

export const dynamic = "force-dynamic"; // 🔴 CLAVE

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/properties/feed", {
          credentials: "include",
        });

        const data = await res.json();

        // 🔴 blindaje total
        if (Array.isArray(data)) {
          setMatches(data);
        } else if (Array.isArray(data?.data)) {
          setMatches(data.data);
        } else {
          console.error("Feed inválido:", data);
          setMatches([]);
        }
      } catch (e) {
        console.error("Error cargando feed", e);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Cargando propiedades…</div>;
  }

  return (
    <main className="bg-gray-100 min-h-screen">
      <MatchDeck matches={matches} />
    </main>
  );
}

