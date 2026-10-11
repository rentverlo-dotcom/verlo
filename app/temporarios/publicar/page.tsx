import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import TemporaryMediaPicker from "./TemporaryMediaPicker"
import { shell, container, nav, navInner, hero, heading, script, subtitle, panel, field, fieldLabel, button } from "../brand"

export const metadata: Metadata = {
  title: "Publicar alquiler temporario | VERLO",
  robots: { index: false, follow: false },
}

export default function PublicarTemporarioPage() {
  return <main style={shell}>
    <header style={nav}><div style={navInner}><VerloBrand width={112} /><Link href="/temporarios" style={{ fontWeight: 900 }}>Volver a temporarios</Link></div></header>
    <div style={{ ...container, maxWidth: 1060 }}>
      <section style={{ ...hero, paddingBottom: 32 }}>
        <h1 style={{ ...heading, fontSize: "clamp(52px,7vw,88px)" }}>Publicá directo.<br /><em style={script}>Tu casa, tus fechas.</em></h1>
        <p style={subtitle}>Publicá una sola vez, mostrá tu propiedad con fotos y administrá su disponibilidad. Para propietarios, VERLO es gratis.</p>
      </section>
      <section style={{ ...panel, maxWidth: 800, marginBottom: 70 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <label style={fieldLabel}>Localidad o zona<input style={field} disabled placeholder="Ej.: Mar Azul, Pinamar, Palermo" /></label>
          <label style={fieldLabel}>Referencia pública de ubicación<input style={field} disabled placeholder="Ej.: a 100 metros de la playa" /></label>
          <label style={fieldLabel}>Tipo de propiedad<select style={field} disabled defaultValue=""><option value="">Elegí una opción</option><option>Casa</option><option>Departamento</option><option>Otro</option></select></label>
          <label style={fieldLabel}>Precio por noche (ARS)<input type="number" style={field} disabled placeholder="Ej.: 120000" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
            <label style={fieldLabel}>Disponible desde<input type="date" disabled style={field}/></label>
            <label style={fieldLabel}>Disponible hasta<input type="date" disabled style={field}/></label>
          </div>
          <label style={fieldLabel}>¿Solicitás seña?<select style={field} disabled defaultValue=""><option value="">Elegí una opción</option><option value="no">No</option><option value="si">Sí, de acuerdo con el inquilino</option></select></label>
          <TemporaryMediaPicker />
          <div style={{ padding: 18, background: "rgba(242,168,169,.22)", borderRadius: 16, border: "1px solid rgba(5,0,2,.1)" }}>
            <strong>¿Cuándo se bloquean las fechas?</strong>
            <p style={{ margin: "9px 0 0" }}>Solo después de la reserva y la seña, si corresponde, cuando propietario e inquilino aceptan expresamente el bloqueo. Un match o un comprobante no bloquean la propiedad.</p>
          </div>
          <p style={{ margin: 0, fontSize: 14 }}>La dirección exacta y los datos bancarios siguen privados. Módulo en preparación.</p>
          <button type="button" disabled style={{ ...button, opacity: .5, cursor: "not-allowed" }}>Publicación en preparación</button>
        </div>
      </section>
    </div>
  </main>
}
