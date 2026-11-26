import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { createCaucionContractPdf } from "@/lib/powermarket/contract-pdf"
import { createSignaturaDocument, getSignaturaSigningUrl } from "@/lib/signatura/client"
import { checkTraditionalSigningReadiness } from "@/lib/identik/traditional-signing-preflight"
import { getGuarantorActor, canonicalEmail } from "@/lib/guarantors/auth"
import { enqueueVerloEmailSafely } from "@/lib/notifications/verlo-email-outbox"

export const runtime="nodejs"
export const dynamic="force-dynamic"
export const maxDuration=60
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

async function loadParticipants(db:any,id:string,email:string,userId:string) {
  const {data:contract,error}=await db.from("lead_contracts")
    .select("id,content,status,owner_lead_id,tenant_lead_id,owner_agreed_at,tenant_agreed_at")
    .eq("id",id).maybeSingle()
  if(error||!contract)return null
  const {data:leads,error:leadError}=await db.from("lead_intake")
    .select("id,email").in("id",[contract.owner_lead_id,contract.tenant_lead_id])
  if(leadError||leads?.length!==2)return null
  const owner=leads.find((x:any)=>x.id===contract.owner_lead_id)
  const tenant=leads.find((x:any)=>x.id===contract.tenant_lead_id)
  if(!owner?.email||!tenant?.email)return null
  const ownerEmail=canonicalEmail(owner.email)
  const tenantEmail=canonicalEmail(tenant.email)
  const {data:guarantors,error:guarantorError}=await db.from("contract_guarantors")
    .select("id,email,full_name,dni,status,auth_user_id")
    .eq("lead_contract_id",id).limit(2)
  if(guarantorError||(guarantors||[]).length>1)return null
  const guarantor=guarantors?.[0]||null
  const role=email===ownerEmail?"owner":email===tenantEmail?"tenant":
    guarantor?.auth_user_id===userId && canonicalEmail(guarantor.email)===email?"guarantor":null
  if(!role)return null
  return {contract,ownerEmail,tenantEmail,guarantor,role}
}

/** Read access to exactly this account's own private signing link. */
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const id=req.nextUrl.searchParams.get("contractId")||""
  if(!uuid.test(id))return reply({ok:false,error:"Invalid contract"},400)
  const participants=await loadParticipants(actor.db,id,actor.email,actor.user.id)
  if(!participants)return reply({ok:false,error:"Contract unavailable"},404)
  const {data:signing,error}=await actor.db.from("signatura_contract_signings")
    .select("status,document_id,owner_signature_id,tenant_signature_id,guarantor_signature_id")
    .eq("lead_contract_id",id).maybeSingle()
  if(error)return reply({ok:false,error:"Unavailable"},503)
  if(!signing) {
    const gate=await checkTraditionalSigningReadiness(actor.db,id,"signatura")
    return reply({ok:true,status:gate.allowed?"ready":"blocked",
      reason:gate.allowed?null:gate.reason,role:participants.role})
  }
  if(signing.status==="completed")return reply({ok:true,status:"completed",role:participants.role})
  if(signing.status!=="pending"||!signing.document_id)
    return reply({ok:true,status:"manual_review_required",role:participants.role})
  const signerId=participants.role==="owner"?signing.owner_signature_id:
    participants.role==="tenant"?signing.tenant_signature_id:signing.guarantor_signature_id
  if(!signerId)return reply({ok:false,error:"Signer missing; reconciliation required"},503)
  try {
    const signingUrl=await getSignaturaSigningUrl(signing.document_id,signerId)
    if(!signingUrl)return reply({ok:true,status:"pending",role:participants.role})
    return reply({ok:true,status:"pending",role:participants.role,signingUrl})
  }catch{return reply({ok:false,error:"Provider unavailable"},502)}
}

/** Explicit user action; no retries or provider-created emails/WhatsApp. */
export async function POST(req:NextRequest) {
  if(process.env.SIGNATURA_CONTRACT_QA_ENABLED!=="true")
    return reply({ok:false,error:"Contract signing is not yet enabled in QA"},503)
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const body=await req.json().catch(()=>null)
  const id=String(body?.contractId||"")
  if(!uuid.test(id)||body?.acknowledged!==true)
    return reply({ok:false,error:"Explicit approval and a valid contract are required"},400)
  const participants=await loadParticipants(actor.db,id,actor.email,actor.user.id)
  if(!participants)return reply({ok:false,error:"Contract unavailable"},404)
  // A guarantor cannot trigger paid document creation on someone else's operation.
  if(participants.role==="guarantor")
    return reply({ok:false,error:"Owner or tenant must prepare the document"},403)
  const gate=await checkTraditionalSigningReadiness(actor.db,id,"signatura")
  if(!gate.allowed)return reply({ok:false,error:"Contract not ready",reason:gate.reason},409)
  const {contract,ownerEmail,tenantEmail,guarantor}=participants
  if(contract.status!=="agreed"||!contract.content)
    return reply({ok:false,error:"Agreement missing"},409)
  if(guarantor) {
    if(process.env.SIGNATURA_GUARANTOR_CLAUSE_APPROVED!=="true")
      return reply({ok:false,error:"Legal review of guarantor clause pending"},503)
    if(guarantor.status!=="accepted"||!guarantor.auth_user_id ||
       !contract.content.includes(guarantor.full_name) ||
       !contract.content.includes("DNI "+guarantor.dni))
      return reply({ok:false,error:"Guarantor not included in agreed document"},409)
  }
  const hash=createHash("sha256").update(contract.content,"utf8").digest("hex")
  // Unique DB reservation precedes all external requests, preventing double charges.
  const {data:reservation,error:reserveError}=await actor.db.from("signatura_contract_signings")
    .insert({lead_contract_id:id,document_sha256:hash,owner_email:ownerEmail,
      tenant_email:tenantEmail,guarantor_email:guarantor?.email||null,
      started_by_user_id:actor.user.id,status:"reserved"})
    .select("id").single()
  if(reserveError||!reservation)return reply({ok:false,error:"Session already reserved; check Mi VERLO"},409)
  try {
    const pdf=createCaucionContractPdf({documentText:contract.content,
      version:1,sha256:hash,contractId:id})
    const signatures=[
      {validations:{BI:null},order:1},
      {validations:{BI:null},order:2},
      ...(guarantor?[{validations:{BI:null},order:3}]:[]),
    ]
    const created=await createSignaturaDocument({
      title:"VERLO QA - Contrato sin validez comercial",
      pdf,signatures,
      complete_url:"https://verlopunto0-git-feature-signatu-009bb9-verlos-projects-b9e9c595.vercel.app/mi-verlo",
    })
    if(!uuid.test(created.id||"")||created.signatures?.length!==signatures.length ||
       created.signatures.some(s=>!uuid.test(s.id))) {
      return reply({ok:false,error:"Provider created an unverified document; manual reconciliation required"},503)
    }
    const ids=created.signatures.map(s=>s.id)
    const {data:saved,error:saveError}=await actor.db.from("signatura_contract_signings")
      .update({document_id:created.id,owner_signature_id:ids[0],tenant_signature_id:ids[1],
        guarantor_signature_id:guarantor?ids[2]:null,status:"pending",
        updated_at:new Date().toISOString()})
      .eq("id",reservation.id).eq("status","reserved").select("id").maybeSingle()
    if(saveError||!saved)
      return reply({ok:false,error:"Provider document created; manual recovery required"},503)
    for(const [role,email] of [
      ["owner",ownerEmail],["tenant",tenantEmail],
      ...(guarantor?[["guarantor",canonicalEmail(guarantor.email)]]:[]),
    ]){
      await enqueueVerloEmailSafely({
        area:"tradicionales",eventType:role==="guarantor"?"guarantor_signature_ready":"signature_ready",
        eventKey:"signatura_contract:"+id+":"+role,recipientEmail:email,
        recipientRole:role as "owner"|"tenant"|"guarantor",url:"/mi-verlo",
      })
    }
    return reply({ok:true,status:"pending",contractId:id},201)
  }catch{
    // Reservation remains locked: retrying could create a second billable document.
    return reply({ok:false,error:"Unknown provider outcome; manual reconciliation required"},503)
  }
}
