"use client"
export default function SupportEmailBubble(){
  return <a href="mailto:soporte@verlo.lat?subject=Consulta%20de%20soporte%20VERLO" aria-label="Contactar al soporte por correo electrónico" title="Escribir a soporte@verlo.lat" style={{position:"fixed",right:20,bottom:22,zIndex:80,display:"inline-flex",alignItems:"center",gap:10,padding:"15px 19px",borderRadius:999,background:"#050002",color:"#fff",fontWeight:850,fontSize:14,textDecoration:"none",boxShadow:"0 10px 30px rgba(0,0,0,.18)"}}>
    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></svg>
    ¿Necesitás ayuda?
  </a>
}
