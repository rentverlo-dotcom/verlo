import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import {shell,container,panel,eyebrow,heading,subtitle,button,outline} from "./brand"

export const metadata: Metadata = {
  title: "Alquileres temporarios | VERLO",
  description: "Alquileres temporarios de 1 a 90 noches. Próximamente en VERLO.",
  robots: {index:false,follow:false},
}

export default function TemporariosPage() {
  return (
    <main style={shell}>
      <div style={container}>
        <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:58,flexWrap:"wrap"}}>
          <VerloBrand />
          <Link href="/" style={{fontSize:14,fontWeight:700,color:"#050002"}}>Volver a VERLO</Link>
        </nav>
        <p style={eyebrow}>VERLO · TEMPORARIOS</p>
        <h1 style={heading}>Tu próximo alquiler temporario, directo.</h1>
        <p style={subtitle}>Alquileres de 1 a 90 noches. Encontrá propiedades según destino, fechas y presupuesto, sin intermediarios inmobiliarios.</p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"30px 0 44px"}}>
          <Link href="/temporarios/buscar" style={button}>Busco alojamiento</Link>
          <span style={{...outline,opacity:0.65}}>Quiero publicar · Próximamente</span>
        </div>
        <section style={panel}>
          <h2 style={{fontSize:"clamp(24px,4vw,32px)",margin:"0 0 18px",color:"#050002"}}>Una propiedad. Muchas fechas posibles.</h2>
          <p>El propietario publica una sola vez y administra las fechas disponibles desde su calendario.</p>
          <p>La seña es opcional y se transfiere directamente al propietario, nunca a VERLO.</p>
          <p><strong>Las fechas solo se bloquean cuando ambas partes lo aceptan expresamente</strong>, después de realizar la reserva y la seña, si corresponde. Un match, el pago a VERLO o el envío de un comprobante no bloquean fechas.</p>
          <p><strong>Inquilinos: $29.900 por contrato temporario.</strong> Propietarios: publicación gratuita.</p>
          <p style={{fontSize:14}}>Módulo en preparación. Por ahora no hay reservas ni pagos habilitados.</p>
        </section>
      </div>
    </main>
  )
}
