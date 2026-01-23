import MatchDeck from "@/components/MatchDeck";

const matches = [
  {
    id: "1",
    title: "Depto 2 amb Palermo",
    address: "Palermo, CABA",
    price: 450000,
    cover_url:
      "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1",
  },
  {
    id: "2",
    title: "Monoambiente Recoleta",
    address: "Recoleta, CABA",
    price: 380000,
    cover_url:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  },
];

export default function MatchesPage() {
  return <MatchDeck matches={matches} />;
}
