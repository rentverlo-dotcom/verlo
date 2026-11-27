import { NextRequest, NextResponse } from "next/server"
import { getGuarantorActor, canonicalEmail, isSyntheticGuarantorEmail } from "@/lib/guarantors/auth"
import { enqueueVerloEmailSafely } from "@/lib/notifications/verlo-email-outbox"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const reply=(value:object,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

async function ownTenantContract(db: any, contractId: string, email: string) {
  const {data:contract,error}=await db.from("lead_contracts")
    .select("id,status,tenant_lead_id,owner_lead_id,content,tenant_agreed_at,owner_agreed_at")
    .eq("id",contractId).maybeSingle()
  if(error || !contract) return null
  const {data:tenant}=await db.from("lead_intake").select("id,email")
    .eq("id",contract.tenant_lead_id).maybeSingle()
  if(!tenant || canonicalEmail(tenant.email || "")!==email) return null
  return contract
}

// Read only; returns the tenant's guarantor contact and onboarding state.
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const contractId=req.nextUrl.searchParams.get("contractId")||""
  if(!uuid.test(contractId))return reply({ok:false,error:"Invalid contract"},400)
  const contract=await ownTenantContract(actor.db,contractId,actor.email)
  if(!contract)return reply({ok:false,error:"Contract unavailable"},404)
  const {data,error}=await actor.db.from("contract_guarantors")
    .select("id,full_name,email,phone,guarantee_kind,status,invited_at,accepted_at,signed_at")
    .eq("lead_contract_id",contractId).limit(5)
  if(error)return reply({ok:false,error:"Unavailable"},503)
  return reply({ok:true,guarantors:data||[]})
}

// Tenant supplies a single proposed guarantor. Never email or bill via this API in QA.
export async function POST(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const body=await req.json().catch(()=>null)
  const contractId=String(body?.contractId||"")
  const fullName=String(body?.fullName||"").trim()
  const dni=String(body?.dni||"").trim()
  const email=canonicalEmail(String(body?.email||""))
  const phone=String(body?.phone||"").trim()
  const legalAddress=String(body?.legalAddress||"").trim()
  const kind=String(body?.guaranteeKind||"")
  if(!uuid.test(contractId) || fullName.length<3 || fullName.length>200 ||
    !/^[0-9]{6,10}$/.test(dni) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    phone.length<6 || phone.length>40 || legalAddress.length>300 ||
    !["personal","property","salary"].includes(kind))
    return reply({ok:false,error:"Invalid guarantor details"},400)
  // Restricted to synthetic identities and QA. Real invitations await provider certification.
  if(!isSyntheticGuarantorEmail(email))return reply({ok:false,error:"QA only: synthetic email required"},422)
  if(email===actor.email)return reply({ok:false,error:"Tenant cannot guarantee themself"},422)
  const contract=await ownTenantContract(actor.db,contractId,actor.email)
  if(!contract)return reply({ok:false,error:"Contract unavailable"},404)
  if(!["draft","generated"].includes(contract.status) ||
    contract.tenant_agreed_at || contract.owner_agreed_at)
    return reply({ok:false,error:"Contract already accepted: changes are locked"},409)
  const {data:owner}=await actor.db.from("lead_intake").select("email")
    .eq("id",contract.owner_lead_id).maybeSingle()
  if(owner && canonicalEmail(owner.email||"")===email)
    return reply({ok:false,error:"Owner cannot be their own guarantor"},422)
  const {data:existing,error:checkError}=await actor.db.from("contract_guarantors")
    .select("id").eq("lead_contract_id",contractId).limit(2)
  if(checkError)return reply({ok:false,error:"Unavailable"},503)
  if(existing?.length)return reply({ok:false,error:"Guarantor already registered; review required"},409)
  const {data:created,error}=await actor.db.from("contract_guarantors").insert({
    lead_contract_id:contractId,full_name:fullName,dni,email,phone,
    legal_address:legalAddress,guarantee_kind:kind,invited_by_user_id:actor.user.id,
  }).select("id").single()
  if(error || !created)return reply({ok:false,error:"Guarantor invitation could not be reserved"},409)
  // The durable record is not evidence of mail delivery. Capture only synthetic QA intent.
  await enqueueVerloEmailSafely({
    area:"tradicionales",eventType:"guarantor_invited",
    eventKey:"guarantor_invited:"+created.id,recipientEmail:email,recipientRole:"guarantor",
    url:"/login?next=%2Fmi-verlo",
  })
  return reply({ok:true,guarantorId:created.id,status:"invited",mailDeliveryConfirmed:false},201)
}
