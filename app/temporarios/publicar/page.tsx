import BrandHeader from "@/app/temporarios/BrandHeader"
import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import TemporaryOwnerDraft from "./TemporaryOwnerDraft"
import { shell, container, nav, navInner, hero, heading, script, subtitle } from "../brand"

export const metadata: Metadata = {
  title: "Publicar alquiler temporario | VERLO",
  robots: { index: false, follow: false },
}

export default function PublicarTemporarioPage() {
  return <main style={shell}>
    <BrandHeader/>
    <div style={{ ...container, maxWidth: 1060 }}>
      <section style={{ ...hero, paddingBottom: 32 }}>
        <h1 style={{ ...heading, fontSize: "clamp(52px,7vw,88px)" }}>Publicá directo.<br /><em style={script}>Tu casa, tus fechas.</em></h1>
        <p style={subtitle}>Publicá una sola vez, mostrá tu propiedad con fotos y administrá su disponibilidad. Para propietarios, VERLO es gratis.</p>
      </section>
      <TemporaryOwnerDraft />
    </div>
  </main>
}
