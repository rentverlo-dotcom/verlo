export const dynamic = "force-dynamic";

import Image from "next/image";

type Match = {
  id: string;
  title: string;
  short_description: string;
  address: string;
  price: number;
  cover_url: string;
};

const savedMatches: Match[] = [
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

export default function GuardadasPage() {
  return (
    <div style={container}>
      <h1 style={title}>Propiedades guardadas</h1>

      <div style={list}>
        {savedMatches.map((match) => (
          <div key={match.id} style={card}>
            <div style={imageWrap}>
              <Image
                src={match.cover_url}
                alt={match.title}
                fill
                style={{ objectFit: "cover" }}
              />
              <div style={overlay} />
            </div>

            <div style={info}>
              <h2>{match.title}</h2>
              <p style={desc}>{match.short_description}</p>
              <p style={address}>{match.address}</p>
              <strong>${match.price}</strong>

              <div style={actions}>
                <button style={{ ...btn, background: "#22c55e" }}>
                  Agendar visita
                </button>
                <button style={{ ...btn, background: "#2563eb" }}>
                  Contactar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
