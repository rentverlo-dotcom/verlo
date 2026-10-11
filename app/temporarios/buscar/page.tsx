import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Buscar alquiler temporario | VERLO",
  description: "Formulario de alquileres temporarios de VERLO en preparación.",
  robots: { index: false, follow: false },
}

export default function BuscarTemporarioPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "48px 20px 88px",
      }}
    >
      <a href="/temporarios">← Temporarios</a>
      <h1>Buscá un alquiler temporario</h1>
      <p>
        Elegí dónde querés alojarte y las fechas de tu estadía.
        VERLO permite alquileres de 1 a 90 noches.
      </p>

      <div
        style={{
          display: "grid",
          gap: 18,
          border: "1px solid #d1d5db",
          borderRadius: 16,
          padding: 24,
          marginTop: 24,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Localidad o zona
          <input
            type="text"
            placeholder="Ej.: Mar Azul, Pinamar, Palermo"
            disabled
            style={{ padding: 12 }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Entrada
            <input type="date" disabled style={{ padding: 12, minWidth: 0 }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Salida
            <input type="date" disabled style={{ padding: 12, minWidth: 0 }} />
          </label>
        </div>
        <label style={{ display: "grid", gap: 6 }}>
          Presupuesto total de la estadía (ARS)
          <input
            type="number"
            min="1"
            placeholder="Ej.: 1200000"
            disabled
            style={{ padding: 12 }}
          />
        </label>
        <p style={{ fontSize: 14, margin: 0 }}>
          El presupuesto es por toda la estadía, no por mes.
          La tarifa de VERLO es de $29.900 por contrato temporario,
          únicamente en el momento de habilitar el cierre.
        </p>
        <button type="button" disabled style={{ padding: 14, cursor: "not-allowed" }}>
          Formulario en preparación
        </button>
      </div>
      <p style={{ fontSize: 13, marginTop: 20 }}>
        Pantalla de desarrollo. No guarda datos, no genera matches,
        no envía mensajes y no inicia pagos.
      </p>
    </main>
  )
}
