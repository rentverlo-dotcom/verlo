import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, panel, eyebrow, heading, subtitle, field, fieldLabel, button } from "../brand"

export const metadata: Metadata = {
  title: "Publicar alquiler temporario | VERLO",
  description: "Publicá tu propiedad temporaria por fechas. Módulo de VERLO en preparación.",
  robots: { index: false, follow: false },
}

export default function PublicarTemporarioPage() {
  return (
    <main style={shell}>
      <div style={{ ...container, maxWidth: 800 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 44, flexWrap: "wrap" }}>
          <VerloBrand />
          <Link href="/temporarios" style={{ color: "#050002", fontSize: 14, fontWeight: 700 }}>← Temporarios</Link>
        </nav>
        <p style={eyebrow}>PROPIETARIOS · TEMPORARIOS</p>
        <h1 style={{ ...heading, fontSize: "clamp(34px,5vw,50px)" }}>Tu propiedad, tus fechas.</h1>
        <p style={subtitle}>Publicá una sola vez. Definí tu precio por noche y administrá la disponibilidad sin volver a cargar la casa.</p>
        <section style={{ ...panel, marginTop: 32 }}>
          <div style={{ display: "grid", gap: 20 }}>
            <label style={fieldLabel}>Localidad o zona
              <input type="text" placeholder="Ej.: Mar Azul, Pinamar, Palermo" disabled style={field} />
            </label>
            <label style={fieldLabel}>Referencia de ubicación (pública)
              <input type="text" placeholder="Ej.: a 100 metros de la playa" disabled style={field} />
            </label>
            <label style={fieldLabel}>Tipo de propiedad
              <select disabled defaultValue="" style={field}>
                <option value="">Elegí una opción</option>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <label style={fieldLabel}>Precio por noche (ARS)
              <input type="number" min="1" placeholder="Ej.: 120000" disabled style={field} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16 }}>
              <label style={fieldLabel}>Disponible desde
                <input type="date" disabled style={field} />
              </label>
              <label style={fieldLabel}>Disponible hasta
                <input type="date" disabled style={field} />
              </label>
            </div>
            <label style={fieldLabel}>¿Solicitás seña?
              <select disabled defaultValue="" style={field}>
                <option value="">Elegí una opción</option>
                <option value="no">No</option>
                <option value="si">Sí, acuerdo el importe con el inquilino</option>
              </select>
            </label>
            <p style={{ fontSize: 14, margin: 0 }}>
              La publicación para propietarios será gratuita. La dirección exacta
              y los datos de transferencia se mantendrán privados durante la búsqueda.
            </p>
            <div style={{ borderRadius: 14, padding: 16, background: "#fff1f8", border: "1px solid #f5d7e5" }}>
              <strong>¿Cuándo se bloquean las fechas?</strong>
              <p style={{ marginBottom: 0, fontSize: 14 }}>
                Solo tras completar la reserva y la seña, si corresponde, cuando
                propietario e inquilino acepten expresamente el bloqueo.
                Un match o un comprobante enviado no bloquean la propiedad.
              </p>
            </div>
            <button type="button" disabled style={{ ...button, border: 0, opacity: 0.55, cursor: "not-allowed" }}>
              Formulario en preparación
            </button>
          </div>
        </section>
        <p style={{ fontSize: 13, marginTop: 20 }}>Vista de desarrollo. No publica propiedades, no guarda datos, no crea reservas y no envía avisos.</p>
      </div>
    </main>
  )
}
