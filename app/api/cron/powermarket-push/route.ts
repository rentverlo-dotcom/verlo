import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { sendPushToLead } from "@/lib/push"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Item={id:string;event_id:string;recipient_lead_id:string;recipient_role:"tenant"|"owner";attempts:number}
const copy:Record<string,[string,string]>={
 application_submitted:["Caución solicitada","Recibimos tu solicitud de caución."],
 application_under_review:["Caución en evaluación","PowerMarket está evaluando tu solicitud."],
 application_more_info_required:["Documentación pendiente","Revisá los próximos pasos de tu caución."],
 application_prequalified:["Caución precalificada","Tu solicitud avanzó. Revisá Mi VERLO."],
 application_not_eligible:["Resultado de caución","Hay una novedad sobre tu solicitud."],
 application_alternative_offered:["Alternativa disponible","Revisá la alternativa de caución en Mi VERLO."],
 application_expired:["Caución vencida","Revisá el estado de tu solicitud."],
 application_withdrawn:["Solicitud retirada","Tu solicitud de caución fue retirada."],
 quote_offered:["Cotización de caución","Tenés una cotización para revisar."],
 quote_accepted:["Cotización aceptada","Tu aceptación quedó registrada."],
 quote_declined:["Cotización rechazada","La cotización fue rechazada."],
 quote_expired:["Cotización vencida","La oferta de caución venció."],
 review_pending:["Contrato en revisión","PowerMarket está revisando el contrato."],
 review_changes_requested:["Contrato con observaciones","El contrato necesita correcciones. Revisá Mi VERLO."],
 review_approved:["Contrato aprobado","PowerMarket aprobó la revisión contractual."],
 policy_pending:["Caución en trámite","La póliza sigue en trámite."],
 policy_final_review:["Caución en revisión final","La póliza avanzó a revisión final."],
 policy_payment_pending:["Pago pendiente en PowerMarket","Revisá los pasos de tu caución en Mi VERLO."],
 policy_issued:["Póliza emitida","Tu póliza de caución está emitida."],
 policy_cancelled:["Caución cancelada","Revisá el estado de la caución."],
 policy_rejected:["Caución no emitida","Revisá el estado de la caución."]
}
export async function POST(req:NextRequest){
 const secret=process.env.CRON_SECRET
 if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`) return NextResponse.json({ok:false,error:"Unauthorized"},{status:401})
 if(process.env.POWERMARKET_PUSH_ENABLED!=="true") return NextResponse.json({ok:true,enabled:false,dry_run:true})
 const live=req.nextUrl.searchParams.get("live")==="true" && process.env.POWERMARKET_PUSH_LIVE_ENABLED==="true"
 if(!live){
  const {data,error}=await supabaseAdmin.from("caucion_push_deliveries").select("id,recipient_role,event_id,status").in("status",["pending","failed"]).limit(20)
  if(error)return NextResponse.json({ok:false,error:"Queue unavailable"},{status:503})
  return NextResponse.json({ok:true,dry_run:true,count:data?.length||0,recipients:(data||[]).map(x=>({delivery_id:x.id,recipient_role:x.recipient_role}))})
 }
 const {data:batch,error:claimError}=await supabaseAdmin.rpc("caucion_push_claim",{p_limit:10})
 if(claimError)return NextResponse.json({ok:false,error:"Cannot claim deliveries"},{status:503})
 const results=[]
 for(const d of (batch||[]) as Item[]){
  let status="failed",sent=0,failed=0,lastError:string|null=null
  try{
   const {data:event,error:eventError}=await supabaseAdmin.from("caucion_events").select("event_type,application_id").eq("id",d.event_id).single()
   if(eventError||!event)throw new Error("Event unavailable")
   const message=copy[event.event_type]
   if(!message)throw new Error("Unsupported event")
   const {data:application,error:applicationError}=await supabaseAdmin.from("caucion_applications").select("tenant_lead_id").eq("id",event.application_id).single()
   if(applicationError||!application)throw new Error("Application unavailable")
   if(d.recipient_role==="tenant"&&application.tenant_lead_id!==d.recipient_lead_id)throw new Error("Recipient mismatch")
   if(d.recipient_role==="owner"){
    const {data:reviews}=await supabaseAdmin.from("caucion_contract_reviews").select("lead_contract_id").eq("application_id",event.application_id)
    const {data:policies}=await supabaseAdmin.from("caucion_policies").select("lead_contract_id").eq("application_id",event.application_id)
    const ids=Array.from(new Set([...(reviews||[]),...(policies||[])].map(x=>x.lead_contract_id).filter(Boolean)))
    if(!ids.length)throw new Error("Owner not linked to contract")
    const {data:contracts,error:contractError}=await supabaseAdmin.from("lead_contracts").select("owner_lead_id").in("id",ids).eq("tenant_lead_id",application.tenant_lead_id).eq("owner_lead_id",d.recipient_lead_id).limit(1)
    if(contractError||!contracts?.length)throw new Error("Owner relationship invalid")
   }
   const result=await sendPushToLead(d.recipient_lead_id,{title:message[0],body:message[1],url:"/mi-verlo"})
   sent=result.sent;failed=result.failed
   status=sent>0?"sent":failed>0?"failed":"unavailable"
   if(failed>0)lastError="Some device deliveries failed"
  }catch(err){lastError=err instanceof Error?err.message:"Delivery failed"}
  const {error:updateError}=await supabaseAdmin.from("caucion_push_deliveries").update({status,sent_devices:sent,failed_devices:failed,last_error:lastError,updated_at:new Date().toISOString()}).eq("id",d.id).eq("status","processing")
  results.push({status,updated:!updateError})
 }
 return NextResponse.json({ok:true,dry_run:false,results})
}
