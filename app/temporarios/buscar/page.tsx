import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import TemporaryTenantDraft from "./TemporaryTenantDraft"
import { shell, container, nav, navInner, hero, heading, script, subtitle } from "../brand"
export const metadata: Metadata = { title: "Buscar alquiler temporario | VERLO", robots: { index: false, follow: false } }
export default function BuscarTemporarioPage() {
  return <main style={shell}>
    <header style={nav}><div style={navInner}><VerloBrand width={112} /><Link href="/temporarios" style={{ fontWeight: 900 }}>Volver a temporarios</Link></div></header>
    <div style={{ ...container, maxWidth: 1060 }}>
      <section style={{ ...hero, paddingBottom: 32 }}>
        <h1 style={{ ...heading, fontSize: "clamp(52px,7vw,88px)" }}>Elegí tus fechas.<br /><em style={script}>Encontrá tu lugar.</em></h1>
        <p style={subtitle}>Buscá alojamiento por 1 a 90 noches, según ubicación y presupuesto total.</p>
      </section>
      <TemporaryTenantDraft />
    </div>
  </main>
}
