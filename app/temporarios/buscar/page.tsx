import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, hero, heading, script, subtitle, panel, field, fieldLabel, button } from "../brand"
export const metadata: Metadata = { title: "Buscar alquiler temporario | VERLO", robots: { index: false, follow: false } }
export default function BuscarTemporarioPage() {
  return <main style={shell}>
    <header style={nav}><div style={navInner}><VerloBrand width={112} /><Link href="/temporarios" style={{ fontWeight: 900 }}>Volver a temporarios</Link></div></header>
    <div style={{ ...container, maxWidth: 1060 }}>
      <section style={{ ...hero, paddingBottom: 32 }}>
        <h1 style={{ ...heading, fontSize: "clamp(52px,7vw,88px)" }}>Elegí tus fechas.<br /><em style={script}>Encontrá tu lugar.</em></h1>
        <p style={subtitle}>Buscá alojamiento por 1 a 90 noches, según ubicación y presupuesto total.</p>
      </section>
      <section style={{ ...panel, marginBottom: 70, maxWidth: 800 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <label style={fieldLabel}>Localidad o zona<input disabled style={field} placeholder="Ej.: Mar Azul, Pinamar, Palermo" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
            <label style={fieldLabel}>Fecha de entrada<input type="date" disabled style={field} /></label>
            <label style={fieldLabel}>Fecha de salida<input type="date" disabled style={field} /></label>
          </div>
          <label style={fieldLabel}>Presupuesto total de la estadía (ARS)<input type="number" disabled style={field} placeholder="Ej.: 1200000" /></label>
          <p style={{ margin: 0, fontSize: 14 }}>El presupuesto corresponde a toda la estadía. VERLO cobra $29.900 al habilitar el cierre del contrato.</p>
          <button disabled style={{ ...button, opacity: .5, cursor: "not-allowed" }}>Formulario en preparación</button>
        </div>
      </section>
    </div>
  </main>
}
