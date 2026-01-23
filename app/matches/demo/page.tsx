"use client";

import TinderCard from "react-tinder-card";

const properties = [
  {
    id: "1",
    title: "Departamento 2 ambientes",
    zone: "Palermo",
    price: 450000,
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    title: "PH con patio",
    zone: "Caballito",
    price: 380000,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  },
];

export default function MatchesDemoPage() {
  const handleSwipe = (dir: string, id: string) => {
    console.log("SWIPE", dir, id);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-xl font-semibold mb-6">
        Propiedades para vos
      </h1>

      <div className="relative w-[320px] h-[440px]">
        {properties.map((p) => (
          <TinderCard
            key={p.id}
            onSwipe={(dir) => handleSwipe(dir, p.id)}
            preventSwipe={["up", "down"]}
          >
            <div
              className="absolute w-full h-full rounded-2xl shadow-2xl bg-cover bg-center flex flex-col justify-end"
              style={{ backgroundImage: `url(${p.image})` }}
            >
              <div className="bg-black/60 p-4 rounded-b-2xl">
                <h2 className="text-lg font-bold">{p.title}</h2>
                <p className="text-sm">{p.zone}</p>
                <p className="text-lg font-semibold mt-1">
                  ${p.price.toLocaleString()}
                </p>
              </div>
            </div>
          </TinderCard>
        ))}
      </div>

      <p className="text-sm text-neutral-400 mt-6">
        Deslizá ➡️ si te interesa · ⬅️ si no
      </p>
    </div>
  );
}
