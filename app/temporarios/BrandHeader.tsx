import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"
import {nav,navInner} from "./brand"

export default function BrandHeader(){
  const link={fontSize:15,fontWeight:850,color:"#6d686a",textDecoration:"none"} as const
  return <header style={nav}><div style={{...navInner,minHeight:116}}>
    <Link href="/temporarios" aria-label="VERLO Temporarios"><VerloBrand width={112}/></Link>
    <nav aria-label="Navegación principal" style={{display:"flex",alignItems:"center",gap:"clamp(12px,2vw,26px)",flexWrap:"wrap",justifyContent:"flex-end"}}>
      <Link href="/temporarios/buscar" style={link}>Alquilar</Link>
      <Link href="/temporarios/publicar" style={link}>Publicar</Link>
      <Link href="/temporarios/mi-verlo" style={link}>Mis temporarios</Link>
      <Link href="/temporarios/mi-verlo" style={{...link,color:"#fff",background:"#292526",padding:"12px 22px",borderRadius:99}}>Ingresar</Link>
    </nav>
  </div></header>
}