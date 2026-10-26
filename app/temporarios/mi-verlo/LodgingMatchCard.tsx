"use client"
import {useState} from "react"
import PropertyGallery from "./PropertyGallery"
import {trackPostHog} from "@/lib/posthog-client"
import {supabase} from "@/lib/supabase/client"

export type LodgingMatch={
  id:string;property_id:string;check_in:string;check_out:string;agreed_total_ars:number;status:string;
  owner_decision:string;tenant_decision:string;
  temporary_properties?:{locality_label:string;property_type:string;nightly_price_ars?:number;title?:string;description?:string;public_location_reference?:string;max_guests?:number}|null
}
type Photo={id:string;property_id:string;mime_type:string}
type Reservation={id:string;match_id:string;status:string;agreed_terms_owner_at:string|null;agreed_terms_tenant_at:string|null;confirmed_by_owner_at?:string|null;confirmed_by_tenant_at?:string|null}
const date=(value:string)=>{const p=value.split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:value}
const money=(value:number)=>Number(value).toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})
const kind=(x:string)=>({casa:"Casa",departamento:"Departamento",cabana:"Cabaña",habitacion:"Habitación"} as Record<string,string>)[x]||"Alojamiento"
export default function LodgingMatchCard({match,photos,role,onDecision,disabled,reservation,onRefresh}:{
 match:LodgingMatch;photos:Photo[];role:"owner"|"tenant";reservation?:Reservation;onRefresh:()=>void;
 onDecision:(id:string,role:"owner"|"tenant",decision:"accepted"|"rejected")=>void;disabled:boolean
}){
 const [open,setOpen]=useState(false)
 const [starting,setStarting]=useState(false)
 const [preparingPayment,setPreparingPayment]=useState(false)
 const [preferenceId,setPreferenceId]=useState("")
 const [checkoutUrl,setCheckoutUrl]=useState("")
 const [accepting,setAccepting]=useState(false)
 const [confirming,setConfirming]=useState(false)
 const [acceptedLocally,setAcceptedLocally]=useState(false)
 const [otherAcceptedLocally,setOtherAcceptedLocally]=useState(false)
 const [reservationMessage,setReservationMessage]=useState("")
 const [reservationId,setReservationId]=useState("")
 async function startReservation(){
  if(starting)return
  setStarting(true);setReservationMessage("")
  trackPostHog("temporary_reservation_started",{product:"temporary",role})
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token)throw Error("Iniciá sesión para continuar")
   const response=await fetch("/api/temporarios/reservations/start",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({matchId:match.id})})
   const data:{ok?:boolean;error?:string;reservation?:{id:string;status:string;reused?:boolean}}=await response.json()
   if(!response.ok||!data.ok||!data.reservation)throw Error(data.error||"No se pudo iniciar la reserva")
   trackPostHog("temporary_reservation_created",{product:"temporary",role})
   setReservationId(data.reservation.id)
   onRefresh()
   setReservationMessage("Reserva en borrador creada. Las fechas aún no están bloqueadas ni se realizó ningún pago.")
  }catch(error){setReservationMessage(error instanceof Error?error.message:"No se pudo iniciar la reserva")}
  finally{setStarting(false)}
 }
 async function preparePayment(){
  if(preparingPayment)return
  setPreparingPayment(true);setReservationMessage("")
  trackPostHog("temporary_checkout_started",{product:"temporary",role})
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token)throw Error("Iniciá sesión para continuar")
   const response=await fetch("/api/temporarios/payments/prepare",{
    method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
    body:JSON.stringify({matchId:match.id})
   })
   const data:{ok?:boolean;error?:string;preferenceId?:string;checkoutUrl?:string}=await response.json()
   if(!response.ok||!data.ok||!data.preferenceId||!data.checkoutUrl)throw Error(data.error||"No se pudo preparar el checkout")
   trackPostHog("temporary_checkout_prepared",{product:"temporary",role})
   setPreferenceId(data.preferenceId)
   setCheckoutUrl(data.checkoutUrl)
   setReservationMessage("Enlace de pago preparado. Las fechas todavía no están bloqueadas.")
  }catch(error){setReservationMessage(error instanceof Error?error.message:"No pudimos preparar el checkout")}
  finally{setPreparingPayment(false)}
 }
 async function acceptTerms(){
  if(accepting)return
  setAccepting(true);setReservationMessage("")
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token)throw Error("Iniciá sesión para continuar")
   const response=await fetch("/api/temporarios/reservations/accept-terms",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({matchId:match.id,role})})
   const data:{ok?:boolean;error?:string;reservation?:{status:string;ownerAccepted:boolean;tenantAccepted:boolean}}=await response.json()
   if(!response.ok||!data.ok||!data.reservation)throw Error(data.error||"No se pudieron aceptar las condiciones")
   trackPostHog("temporary_terms_accepted",{product:"temporary",role})
   setAcceptedLocally(true)
   setOtherAcceptedLocally(role==="owner"?data.reservation.tenantAccepted:data.reservation.ownerAccepted)
   setReservationMessage(data.reservation.ownerAccepted&&data.reservation.tenantAccepted?"Ambas partes aceptaron las condiciones. Todavía no hay reserva confirmada ni fechas bloqueadas.":"Guardamos tu aceptación. Falta que la otra parte acepte las condiciones.")
   onRefresh()
  }catch(error){setReservationMessage(error instanceof Error?error.message:"No pudimos guardar tu aceptación")}
  finally{setAccepting(false)}
 }
 async function confirmReservation(){
  if(confirming)return
  setConfirming(true);setReservationMessage("")
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token)throw Error("Iniciá sesión para continuar")
   const response=await fetch("/api/temporarios/reservations/confirm",{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},
    body:JSON.stringify({matchId:match.id,role})
   })
   const data:{ok?:boolean;error?:string;reservation?:{status:string}}=await response.json()
   if(!response.ok||!data.ok)throw Error(data.error||"No se pudo confirmar la reserva")
   trackPostHog("temporary_reservation_confirmation",{product:"temporary",role,status:data.reservation?.status||"pending"})
   setReservationMessage(data.reservation?.status==="confirmed"
    ?"Reserva confirmada. Las fechas quedaron bloqueadas."
    :"Confirmación registrada. Falta la aprobación de la otra parte.")
   onRefresh()
  }catch(error){setReservationMessage(error instanceof Error?error.message:"No se pudo confirmar la reserva")}
  finally{setConfirming(false)}
 }
 const hasDraft=Boolean(reservation||reservationId)
 const myTermsAccepted=acceptedLocally||(role==="owner"?Boolean(reservation?.agreed_terms_owner_at):Boolean(reservation?.agreed_terms_tenant_at))
 const otherTermsAccepted=otherAcceptedLocally||(role==="owner"?Boolean(reservation?.agreed_terms_tenant_at):Boolean(reservation?.agreed_terms_owner_at))
 const p=match.temporary_properties
 const ownDecision=role==="owner"?match.owner_decision:match.tenant_decision
 const otherDecision=role==="owner"?match.tenant_decision:match.owner_decision
 const todayArgentina=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())
 const expired=match.check_in<todayArgentina
 const nights=Math.round((Date.parse(match.check_out+"T00:00:00Z")-Date.parse(match.check_in+"T00:00:00Z"))/86400000)
 const cardStyle={background:"#fff",borderRadius:22,padding:16,marginBottom:18,border:"1px solid #eee4e7"} as const
 return <article style={cardStyle}>
  <PropertyGallery photos={photos}/>
  <div style={{padding:"15px 5px 4px"}}>
   <div style={{fontSize:13,fontWeight:900,color:"#9e6877",textTransform:"uppercase",letterSpacing:".05em"}}>{match.status==="rejected"?"Coincidencia rechazada":expired&&reservation?.status!=="confirmed"?"Fechas vencidas":match.status==="accepted"?"Ambos aceptaron":"Nueva coincidencia"}</div>
   <h3 style={{fontSize:24,margin:"8px 0 6px",letterSpacing:"-.035em"}}>{p?.title||kind(p?.property_type||"")} · {p?.locality_label||"Alojamiento compatible"}</h3>
   <p style={{color:"#6c6266",margin:"5px 0"}}>{date(match.check_in)} al {date(match.check_out)} · {nights} noches</p>
   <p style={{fontSize:23,fontWeight:900,margin:"10px 0 16px"}}>{money(match.agreed_total_ars)} <span style={{fontSize:13,fontWeight:500,color:"#6c6266"}}>total de la estadía</span></p>
   <button type="button" aria-expanded={open} onClick={()=>{if(!open)trackPostHog("temporary_match_details_opened",{product:"temporary",role});setOpen(x=>!x)}} style={{border:"1px solid #050002",borderRadius:99,background:open?"#fff":"#050002",color:open?"#050002":"#fff",padding:"13px 24px",fontWeight:850,cursor:"pointer"}}>{open?"Cerrar detalles":"Ver alojamiento y detalles"}</button>
   {open&&<div style={{paddingTop:22,marginTop:20,borderTop:"1px solid #e9dfe2"}}>
     <h4 style={{fontSize:19,margin:"0 0 12px"}}>Tu estadía</h4>
     <p><strong>Entrada:</strong> {date(match.check_in)} · <strong>Salida:</strong> {date(match.check_out)}</p>
     {p?.nightly_price_ars&&<p><strong>Precio por noche:</strong> {money(p.nightly_price_ars)}</p>}
     {p?.max_guests&&<p><strong>Capacidad:</strong> hasta {p.max_guests} huéspedes</p>}
     {p?.public_location_reference&&<p><strong>Zona:</strong> {p.public_location_reference}</p>}
     {p?.description&&<p style={{lineHeight:1.55}}>{p.description}</p>}
     <p style={{color:"#685f64"}}>Tu respuesta: {ownDecision==="accepted"?"Aceptaste":ownDecision==="rejected"?"Rechazaste":"Pendiente"} · Otra parte: {otherDecision==="accepted"?"Aceptó":otherDecision==="rejected"?"Rechazó":"Pendiente"}</p>
     {expired&&reservation?.status!=="confirmed"&&<p role="status" style={{padding:12,background:"#fff4ee",borderRadius:12}}>Las fechas de esta coincidencia ya pasaron. Registrá una búsqueda nueva para continuar.</p>}
     {match.status==="accepted"&&!expired&&<div style={{marginTop:16,padding:16,background:"#fbf3f5",borderRadius:16}}>
      <p style={{fontSize:14,color:"#51474c",margin:"0 0 12px"}}>Ambas partes aceptaron. Podés iniciar el trámite de reserva; todavía no bloquea fechas ni cobra dinero.</p>
      <button type="button" disabled={starting||hasDraft} onClick={()=>void startReservation()} style={{background:"#050002",color:"white",border:0,borderRadius:99,padding:"13px 22px",fontWeight:850,cursor:starting?"wait":"pointer",opacity:starting?.6:1}}>{starting?"Iniciando...":hasDraft?"Borrador iniciado":"Iniciar reserva"}</button>
      {hasDraft&&<div style={{marginTop:17,paddingTop:15,borderTop:"1px solid #e5d5da"}}>
        <strong style={{fontSize:16}}>Condiciones de la estadía</strong>
        <p style={{fontSize:13,lineHeight:1.55}}>Estadía del {date(match.check_in)} al {date(match.check_out)} por {money(match.agreed_total_ars)}. Al aceptar confirmás estas fechas y el precio indicado; esto no realiza ningún pago ni bloquea el calendario.</p>
        <p style={{fontSize:13}}>Tu aceptación: <strong>{myTermsAccepted?"Registrada":"Pendiente"}</strong> · Otra parte: <strong>{otherTermsAccepted?"Registrada":"Pendiente"}</strong></p>
        {!myTermsAccepted&&<button type="button" disabled={accepting} onClick={()=>void acceptTerms()} style={{background:"#050002",color:"white",border:0,borderRadius:99,padding:"12px 18px",fontWeight:850,cursor:"pointer"}}>{accepting?"Guardando...":"Acepto las fechas y el precio"}</button>}
      </div>}
      {hasDraft&&myTermsAccepted&&otherTermsAccepted&&<section aria-label="Próximos pasos de la reserva" style={{marginTop:18,padding:"18px 16px",borderRadius:16,background:"#fff",border:"1px solid #ecdde2"}}>
       <strong style={{fontSize:18}}>Condiciones aceptadas por ambas partes</strong>
       <p style={{fontSize:13,lineHeight:1.55,color:"#63565d"}}>El importe de la estadía es {money(match.agreed_total_ars)} y se acuerda entre las partes. VERLO cobra {money(49999)} una sola vez al inquilino por el contrato digital y los servicios asociados, incluyendo validación de identidad, testigo digital y acceso al panel. No es un cargo por reservar ni forma parte del alquiler.</p>
       <div style={{display:"grid",gap:10,fontSize:14,lineHeight:1.5}}>
        <div><strong>1. Condiciones</strong> · Aceptadas por ambas partes.</div>
        <div><strong>2. Pago de VERLO</strong> · {reservation?.status==="fee_paid"||reservation?.status==="deposit_pending"||reservation?.status==="ready_to_block"||reservation?.status==="confirmed"?"Estado registrado en el sistema.":"Pendiente de pago."}</div>
        <div><strong>3. Confirmación de fechas</strong> · {reservation?.status==="confirmed"?"Reserva confirmada.":"Pendiente. Ambas partes deberán aprobar expresamente el bloqueo."}</div>
       </div>
       {role==="tenant"&&reservation?.status==="terms_accepted"&&<div style={{marginTop:14}}>
        <button type="button" disabled={preparingPayment} onClick={()=>void preparePayment()}
         style={{border:0,borderRadius:99,background:"#050002",color:"#fff",padding:"12px 20px",fontWeight:850,cursor:"pointer"}}>
         {preparingPayment?"Preparando...":preferenceId?"Pagar":"Pagar"}
        </button>
        <p style={{fontSize:13,marginTop:14}}>Mercado Pago comunica el resultado directamente a VERLO. No necesitás ingresar números de operación.</p>
         <button type="button" onClick={onRefresh} style={{padding:"11px 15px",border:"1px solid #ddd",borderRadius:99,background:"#fff",fontWeight:800}}>Actualizar estado del pago</button>
         {checkoutUrl&&<p style={{fontSize:13,marginTop:12}}><a href={checkoutUrl} target="_blank" rel="noopener noreferrer" style={{fontWeight:850,color:"#050002",textDecoration:"underline"}}>Pagar</a></p>}
        <p style={{fontSize:12,color:"#73666d"}}>Pagá con tarjeta de débito o crédito. El importe de la estadía se acuerda y paga directamente al propietario.</p>
       </div>}
       {(reservation?.status==="fee_paid"||reservation?.status==="ready_to_block"||reservation?.status==="confirmed")&&<div style={{marginTop:18,padding:14,borderRadius:12,background:"#fbf4f5"}}>
        <strong>Confirmación definitiva de fechas</strong>
        <p style={{fontSize:13}}>Propietario: {reservation.confirmed_by_owner_at?"Confirmó":"Pendiente"} · Inquilino: {reservation.confirmed_by_tenant_at?"Confirmó":"Pendiente"}</p>
        <p style={{fontSize:12,color:"#73666d"}}>La reserva solo queda confirmada y las fechas bloqueadas cuando ambas partes autorizan el bloqueo.</p>
        {reservation.status!=="confirmed" && !(role==="owner"?reservation.confirmed_by_owner_at:reservation.confirmed_by_tenant_at)&&
         <button type="button" onClick={()=>void confirmReservation()} disabled={confirming}
          style={{background:"#050002",color:"#fff",border:0,borderRadius:99,padding:"12px 18px",fontWeight:850}}>
          {confirming?"Confirmando...":"Confirmar reserva y autorizar bloqueo"}
         </button>}
        {reservation.status==="confirmed"&&<strong role="status">Reserva confirmada · Fechas bloqueadas</strong>}
       </div>}
       <a href={"/temporarios/contrato?matchId="+encodeURIComponent(match.id)} style={{display:"inline-flex",marginTop:18,padding:"12px 20px",background:"#050002",color:"#fff",borderRadius:99,textDecoration:"none",fontWeight:850}}>Ver contrato digital</a>
       <p style={{fontSize:12,color:"#73666d",marginBottom:0}}>Aceptar condiciones no implica reservar fechas. No envíes dinero por esta pantalla.</p>
      </section>}
      {reservationMessage&&<p role="status" style={{fontSize:14,margin:"12px 0 0"}}>{reservationMessage}</p>}
     </div>}
     {match.status==="new"&&!expired&&ownDecision==="pending"&&<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
       <button type="button" disabled={disabled} onClick={()=>onDecision(match.id,role,"accepted")} style={{background:"#050002",color:"white",border:0,borderRadius:99,padding:"12px 22px",fontWeight:850}}>Aceptar coincidencia</button>
       <button type="button" disabled={disabled} onClick={()=>onDecision(match.id,role,"rejected")} style={{background:"#f5edef",color:"#050002",border:0,borderRadius:99,padding:"12px 22px",fontWeight:850}}>Rechazar</button>
     </div>}
   </div>}
  </div>
 </article>
}
