import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Publicar propiedad gratis en Argentina | VERLO",
  description: "Publicá tu propiedad gratis en VERLO, recibí candidatos compatibles y coordiná el alquiler directo. El propietario no paga a VERLO.",
  alternates: { canonical: "https://verlo.lat/propietarios" },
  openGraph: {
    title: "Publicá tu propiedad gratis | VERLO",
    description: "Encontrá inquilinos compatibles y alquilá directamente. Publicar en VERLO es gratis para propietarios.",
    url: "https://verlo.lat/propietarios",
  },
}

export default function PropietariosLayout({ children }: { children: React.ReactNode }) {
  return children
}
