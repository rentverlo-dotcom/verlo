import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Alquileres temporarios | VERLO",
  description:
    "VERLO Temporarios: alquileres por 1 a 90 noches. Próximamente podrás buscar y publicar propiedades por fechas.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function TemporariosPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "64px 24px",
        minHeight: "75vh",
        fontFamily: "inherit",
      }}
    >
      <p style={{ fontWeight: 700, letterSpacing: "0.08em" }}>
        VERLO / TEMPORARIOS
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.15 }}>
        Alquileres temporarios de 1 a 90 noches
      </h1>
      <p style={{ fontSize: 18, lineHeight: 1.65 }}>
        Estamos preparando una experiencia para buscar y publicar alquileres
        temporarios según ubicación, fechas y presupuesto.
      </p>
      <section
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 16,
          padding: 24,
          marginTop: 32,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Cómo funcionará</h2>
        <p>Una propiedad se publica una sola vez y sus fechas se administran desde un calendario.</p>
        <p>
          El propietario puede solicitar una seña opcional, que el inquilino
          transfiere directamente al propietario, nunca a VERLO.
        </p>
        <p>
          Las fechas solo se bloquean después de completar la reserva, cuando
          corresponde, y cuando ambas partes confirman expresamente el bloqueo.
          Un match, el pago a VERLO o un comprobante no bloquean fechas.
        </p>
        <p>
          La tarifa prevista de VERLO para el inquilino es de $29.900 por
          contrato temporario. Publicar es gratis para propietarios.
        </p>
      </section>
      <p style={{ marginTop: 32, fontSize: 14 }}>
        Módulo en preparación. Los formularios y las reservas temporarias
        todavía no están habilitados.
      </p>
    </main>
  )
}
