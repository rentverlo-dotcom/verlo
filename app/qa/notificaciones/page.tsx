import { notFound } from "next/navigation"
import { renderVerloEmail, type VerloEmailArea, type VerloEmailRole } from "@/lib/notifications/verlo-email-templates"

export const dynamic = "force-dynamic"

const EXAMPLES: { area: VerloEmailArea; role: VerloEmailRole; type: string; label: string;
  pushTitle?: string; pushBody?: string; pushUrl?: string }[] = [
  { area: "tradicionales", role: "tenant", type: "match_created",
    label: "Coincidencia para inquilino",
    pushTitle: "Tenés una nueva coincidencia",
    pushBody: "Encontramos una coincidencia para tu búsqueda o publicación.",
    pushUrl: "/mi-verlo" },
  { area: "tradicionales", role: "owner", type: "owner_match_digest",
    label: "Novedades para propietario",
    pushTitle: "Tenés novedades de tus candidatos",
    pushBody: "Revisá las coincidencias de tu publicación.",
    pushUrl: "/mi-verlo" },
  { area: "tradicionales", role: "tenant", type: "contract_generated",
    label: "Contrato disponible",
    pushTitle: "Tu contrato está disponible",
    pushBody: "Ingresá a Mi VERLO para revisar el contrato.",
    pushUrl: "/mi-verlo" },
  { area: "temporarios", role: "tenant", type: "reservation_confirmed",
    label: "Reserva temporaria confirmada",
    pushTitle: "VERLO Temporarios",
    pushBody: "Tu reserva de VERLO fue confirmada",
    pushUrl: "/temporarios/mi-verlo" },
  { area: "temporarios", role: "owner", type: "temporary_action_required",
    label: "Acción pendiente del propietario",
    pushTitle: "VERLO Temporarios",
    pushBody: "Tenés una acción pendiente en VERLO Temporarios",
    pushUrl: "/temporarios/mi-verlo" },
  { area: "powermarket", role: "tenant", type: "policy_payment_pending",
    label: "Caución: pago pendiente",
    pushTitle: "Pago de caución pendiente",
    pushBody: "Revisá los pasos de tu caución en Mi VERLO.",
    pushUrl: "/mi-verlo" },
  { area: "powermarket", role: "owner", type: "policy_issued",
    label: "Propietario: póliza emitida",
    pushTitle: "Póliza de caución emitida",
    pushBody: "La póliza de caución del alquiler fue emitida.",
    pushUrl: "/mi-verlo" },
]

const badge = "display:inline-block;border-radius:999px;padding:5px 10px;background:#f3e9e9;color:#524546;font-size:12px;font-weight:700"

export default function QaNotificationsPreview() {
  const allowed = process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "qa/verlo-e2e" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://anptswspguyotnasoacq.supabase.co"
  if (!allowed) notFound()

  return <main style={{minHeight:"100vh",background:"#f7f3f1",color:"#241b1c",padding:"32px 16px",fontFamily:"Arial,Helvetica,sans-serif"}}>
    <div style={{maxWidth:1120,margin:"0 auto"}}>
      <p style={{fontWeight:900,letterSpacing:2,fontSize:12}}>VERLO · CIERRE DEL MVP · SOLO QA</p>
      <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(30px,5vw,52px)",margin:"10px 0"}}>Email y Push: vista previa</h1>
      <p style={{lineHeight:1.7,maxWidth:800}}>
        Los emails de abajo se generan con el <strong>mismo renderizador</strong> que usa VERLO.
        Los ejemplos Push reproducen textos existentes del código; en Tradicionales el contenido también puede variar
        con cada evento. Esta página no consulta usuarios, no modifica la base, no solicita permisos y no envía mensajes.
      </p>
      <p style={{...{padding:14,background:"#fff",borderRadius:14,border:"1px solid #e1d7d6"},lineHeight:1.6}}>
        <strong>Atención:</strong> una previsualización no confirma entrega. Los envíos reales y la
        recepción en dispositivos se certificarán por separado antes del lanzamiento.
      </p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,420px),1fr))",gap:20,marginTop:25}}>
        {EXAMPLES.map(ex => {
          const email = renderVerloEmail({area:ex.area,role:ex.role,type:ex.type})
          return <section key={ex.area+ex.role+ex.type} style={{background:"#fff",border:"1px solid #e6dddc",borderRadius:20,padding:18,minWidth:0}}>
            <p style={{...{margin:0},fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{ex.label}</p>
            <p style={{fontSize:12,opacity:.65,margin:"8px 0"}}>{ex.area} · {ex.role==="owner"?"propietario":"inquilino"} · {ex.type}</p>
            <h2 style={{fontSize:19,margin:"18px 0 8px"}}>Correo transaccional</h2>
            <p><span style={{fontWeight:700}}>De:</span> VERLO &lt;notificaciones@verlo.lat&gt;</p>
            <p><span style={{fontWeight:700}}>Asunto:</span> {email.subject}</p>
            <iframe title={"Correo: "+ex.label} sandbox="" srcDoc={email.html}
              style={{width:"100%",height:375,border:"1px solid #ddd",borderRadius:12,background:"white"}}/>
            <p style={{fontSize:12,opacity:.65}}>Enlace del email: {email.url}</p>
            <h2 style={{fontSize:19,margin:"22px 0 12px"}}>Notificación Push</h2>
            <div style={{borderRadius:18,background:"#eef0f3",padding:16,boxShadow:"0 5px 18px #17171718"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:12,opacity:.7,marginBottom:9}}>
                <span>VERLO · Vista previa</span><span>Ahora</span>
              </div>
              <strong style={{display:"block",fontSize:15}}>{ex.pushTitle}</strong>
              <p style={{fontSize:14,lineHeight:1.45,margin:"7px 0"}}>{ex.pushBody}</p>
              <p style={{fontSize:11,margin:0,opacity:.6}}>Destino: {ex.pushUrl}</p>
            </div>
          </section>
        })}
      </div>
      <p style={{fontSize:12,opacity:.65,paddingTop:24}}>
        Referencia: textos de las plantillas VERLO existentes. No es un nuevo canal de notificación,
        no incluye datos personales reales y está limitado al Preview de QA.
      </p>
    </div>
  </main>
}
