// app/matches/page.tsx
'use client'

export const dynamic = "force-dynamic";

import MatchDeck from "@/components/MatchDeck";
import FlowHeader from "@/components/FlowHeader";

const matches = [
  {
    id: "1",
    title: "Depto 2 amb Palermo",
    short_description: "Luminoso, balcón y ubicación top para entrar ya.",
    address: "Palermo, CABA",
    price: 450000,
    cover_url:
      "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1",
  },
  {
    id: "2",
    title: "Monoambiente Recoleta",
    short_description: "Compacto, moderno y a pasos de todo.",
    address: "Recoleta, CABA",
    price: 380000,
    cover_url:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  },
];

export default function MatchesPage() {
  return (
    <>
      <FlowHeader showSaved />
      <MatchDeck matches={matches} />
    </>
  );
}
