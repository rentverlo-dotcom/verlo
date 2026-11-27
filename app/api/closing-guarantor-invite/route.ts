import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { enqueueVerloEmail } from "@/lib/notifications/verlo-email-outbox"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const reply=(v:object,s=200)=>NextResponse.json(v,{status:s,headers:{"Cache-Control":"no-store"}})
const QA_URL="https://anptswspguyotnasoacq.supabase.co"
function allowed(){
 const qa=process.env.VERCEL_ENV==="preview" &&
  process.env.VERCEL_GIT_COMMIT_REF==="feature/signatura-qa-integration" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL===QA_URL
 const prod=process.env.VERCEL_ENV==="production" &&
  process.env.VERLO_GUARANTOR_INVITES_LIVE==="true" &&
  process.env.VERLO_EMAIL_CUTOVER_APPROVED==="true"
 return qa||prod
}
async function getTenantContract(token:string){
 if(!allowed() || token.length<20 || token.length>300)return null
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return null
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data:access,error:accessError}=await db.from("lead_contract_access_tokens")
  .select("contract_id,lead_id,role,expires_at,revoked_at")
  .eq("token",token).maybeSingle()
 if(accessError||!access||access.role!=="tenant"||access.revoked_at||
    (access.expires_at&&Date.parse(access.expires_at)<Date.now()))return null
 const {data:contract,error}=await db.from("lead_contracts")
  .select("id,tenant_lead_id,owner_lead_id,status,tenant_agreed_at,owner_agreed_at")
  .eq("id",access.contract_id).maybeSingle()
 if(error||!contract||contract.tenant_lead_id!==access.lead_id)return null
 const {data:tenant}=await db.from("lead_intake").select("email").eq("id",access.lead_id).maybeSingle()
 if(!tenant?.email)return null
 return {db,access,contract,email:String(tenant.email).trim().toLowerCase()}
}

export async function GET(req:NextRequest){
 const record=await getTenantContract(req.nextUrl.searchParams.get("token")||"")
 if(!record)return reply({ok:false,error:"Not authorized"},403)
 const {data,error}=await record.db.from("contract_guarantors")
  .select("id,full_name,email,status,review_status,document_revision,approved_revision")
  .eq("lead_contract_id",record.contract.id).limit(1).maybeSingle()
 if(error)return reply({ok:false,error:"Unavailable"},503)
 return reply({ok:true,guarantor:data?{
  id:data.id,fullName:data.full_name,email:data.email,status:data.status,
  reviewStatus:data.review_status,
  approved:data.review_status==="approved"&&data.document_revision===data.approved_revision,
 }:null})
}

export async function POST(req:NextRequest){
 const body=await req.json().catch(()=>null)
 const token=String(body?.token||"")
 const record=await getTenantContract(token)
 if(!record)return reply({ok:false,error:"Not authorized"},403)
 const {db,contract,access,email:tenantEmail}=record
 const fullName=String(body?.fullName||"").trim()
 const dni=String(body?.dni||"").replace(/\D/g,"")
 const email=String(body?.email||"").trim().toLowerCase()
 const phone=String(body?.phone||"").trim()
 const legalAddress=String(body?.legalAddress||"").trim()
 const kind=String(body?.guaranteeKind||"")
 if(fullName.length<3||fullName.length>200||!/^[0-9]{6,10}$/.test(dni)||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||
    phone.length<6||phone.length>40||legalAddress.length>300||
    !["personal","property","salary"].includes(kind))
   return reply({ok:false,error:"Revisá los datos del garante"},400)
 const qa=process.env.VERCEL_ENV==="preview"
 if(qa && !/^[a-z0-9._%+-]+@example\.com$/.test(email))
   return reply({ok:false,error:"En QA solamente se permiten emails ficticios"},422)
 if(email===tenantEmail)return reply({ok:false,error:"El inquilino no puede ser su garante"},422)
 if(!["draft","generated"].includes(contract.status)||
    contract.tenant_agreed_at||contract.owner_agreed_at)
   return reply({ok:false,error:"El contrato ya fue aceptado; requiere revisión"},409)
 const {data:owner}=await db.from("lead_intake").select("email")
  .eq("id",contract.owner_lead_id).maybeSingle()
 if(owner?.email?.trim().toLowerCase()===email)
   return reply({ok:false,error:"El propietario no puede ser el garante de su propio contrato"},422)
 const {data:existing,error:existingError}=await db.from("contract_guarantors")
  .select("id").eq("lead_contract_id",contract.id).limit(1)
 if(existingError)return reply({ok:false,error:"No se pudo verificar la invitación"},503)
 if(existing?.length)return reply({ok:false,error:"Ya existe una invitación para este contrato"},409)
 // Resolve the trusted deployment before reserving a one-time invitation.
 const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL || ""
 const isTrustedPreview = process.env.VERCEL_ENV === "preview" &&
   /^([a-z0-9-]+\.)+vercel\.app$/i.test(previewHost)
 if(qa&&!isTrustedPreview)
   return reply({ok:false,error:"QA preview activation host unavailable"},503)
 const invitation=randomBytes(32).toString("hex")
 const digest=createHash("sha256").update(invitation).digest("hex")
 const {data:created,error}=await db.from("contract_guarantors").insert({
  lead_contract_id:contract.id,full_name:fullName,dni,email,phone,
  legal_address:legalAddress,guarantee_kind:kind,invited_by_lead_id:access.lead_id,
  invitation_token_hash:digest,
  invitation_expires_at:new Date(Date.now()+7*86400000).toISOString(),
 }).select("id").single()
 if(error||!created)return reply({ok:false,error:"No se pudo guardar el garante"},409)
 const destination = (qa ? "https://"+previewHost : "https://verlo.lat")+
   "/garante/activar?invite="+invitation
 // Reserve a durable notification intent, but NEVER report mail delivery
 // merely because the guarantor record was created. QA never dispatches externally.
 let queueStatus:"queued"|"duplicate"|"disabled"|"invalid"|"unavailable"="unavailable"
 try {
   queueStatus=await enqueueVerloEmail({
     area:"tradicionales",eventType:"guarantor_invited",
     eventKey:"guarantor_invited:"+created.id,
     recipientEmail:email,recipientRole:"guarantor",url:destination,
   })
 }catch {
   console.error("VERLO guarantor invitation queue unavailable", {guarantorId:created.id})
 }
 return reply({
   ok:true,status:"invited",guarantorId:created.id,
   invitationEmail:queueStatus==="queued"||queueStatus==="duplicate"?"queued":"pending_configuration",
   emailDeliveryConfirmed:false,
 },201)
}
