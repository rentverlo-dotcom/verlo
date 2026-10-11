import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import { shell, container, nav, navInner, hero, heading, script, subtitle, button, outline, panel } from "./brand"

export const metadata: Metadata = {
  title: "Alquileres temporarios | VERLO",
  description: "Alquileres temporarios de 1 a 90 noches. Próximamente en VERLO.",
  robots: { index: false, follow: false },
}
export default function TemporariosPage() {
  return <main style={shell}>
    <header style={nav}><div style={navInner}>
      <VerloBrand width={112} />
      <Link href="/" style={{ fontSize: 14, fontWeight: 900, color: "#050002" }}>Volver a VERLO</Link>
    </div></header>
    <div style={container}>
      <section style={hero}>
        <h1 style={heading}>Alquilá directo.<br /><em style={script}>Encontrá tu verano.</em></h1>
        <p style={subtitle}>Alquileres temporarios de 1 a 90 noches. Elegí destino, fechas y presupuesto. Conectá directamente con propietarios.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34 }}>
          <Link href="/temporarios/buscar" style={button}>Busco alojamiento</Link>
          <Link href="/temporarios/publicar" style={outline}>Quiero publicar</Link>
        </div>
      </section>
      <section style={{ ...panel, marginBottom: 76 }}>
        <h2 style={{ fontSize: "clamp(27px,4vw,42px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 22px" }}>Una propiedad. Muchas fechas posibles.</h2>
        <p>Publicás una sola vez y administrás la disponibilidad de tu propiedad.</p>
        <p>La seña es opcional y se transfiere directamente al propietario, nunca a VERLO.</p>
        <p><strong>Las fechas solo se bloquean cuando ambas partes lo aceptan expresamente</strong>, después de completar la reserva y la seña, si corresponde. El match, el pago a VERLO o el comprobante no bloquean fechas.</p>
        <p><strong>Inquilinos: $29.900 por contrato temporario. Propietarios: gratis.</strong></p>
        <p style={{ fontSize: 14 }}>Módulo en preparación. Formularios sin envíos ni pagos habilitados.</p>
      </section>
    </div>
  </main>
}
