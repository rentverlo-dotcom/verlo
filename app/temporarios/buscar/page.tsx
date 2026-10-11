import type { Metadata } from "next"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import {shell,container,panel,eyebrow,heading,subtitle,field,fieldLabel,button} from "../brand"

export const metadata: Metadata = {
  title: "Buscar alquiler temporario | VERLO",
  description: "Buscá alquileres temporarios por fechas y presupuesto.",
  robots: {index:false,follow:false},
}

export default function BuscarTemporarioPage() {
  return (
    <main style={shell}>
      <div style={{...container,maxWidth:780}}>
        <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:44,flexWrap:"wrap"}}>
          <VerloBrand />
          <Link href="/temporarios" style={{color:"#050002",fontSize:14,fontWeight:700}}>← Temporarios</Link>
        </nav>
        <p style={eyebrow}>INQUILINOS · TEMPORARIOS</p>
        <h1 style={{...heading,fontSize:"clamp(34px,5vw,50px)"}}>Elegí tus fechas. Encontrá tu lugar.</h1>
        <p style={subtitle}>Buscá alojamiento de 1 a 90 noches, según ubicación y presupuesto total.</p>
        <section style={{...panel,marginTop:32}}>
          <div style={{display:"grid",gap:20}}>
            <label style={fieldLabel}>Localidad o zona
              <input type="text" placeholder="Ej.: Mar Azul, Pinamar, Palermo" disabled style={field}/>
            </label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:16}}>
              <label style={fieldLabel}>Fecha de entrada<input type="date" disabled style={field}/></label>
              <label style={fieldLabel}>Fecha de salida<input type="date" disabled style={field}/></label>
            </div>
            <label style={fieldLabel}>Presupuesto total de la estadía (ARS)
              <input type="number" min="1" placeholder="Ej.: 1200000" disabled style={field}/>
            </label>
            <p style={{fontSize:14,margin:0}}>El presupuesto es por la estadía completa, no mensual. VERLO cobra $29.900 al inquilino por contrato temporario al habilitar el cierre.</p>
            <button type="button" disabled style={{...button,border:0,opacity:0.55,cursor:"not-allowed"}}>Formulario en preparación</button>
          </div>
        </section>
        <p style={{fontSize:13,marginTop:20}}>Pantalla de desarrollo: no guarda datos, no crea matches, no envía avisos y no inicia pagos.</p>
      </div>
    </main>
  )
}
