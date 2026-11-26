import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { createCaucionContractPdf } from "@/lib/powermarket/contract-pdf"
import { createSignaturaDocument, getSignaturaSigningUrl } from "@/lib/signatura/client"
import { checkTraditionalSigningReadiness } from "@/lib/identik/traditional-signing-preflight"
import { getGuarantorActor, canonicalEmail } from "@/lib/guarantors/auth"
import { loadSignaturaContractParticipants } from "@/lib/signatura/contract-access"
import { enqueueVerloEmailSafely } from "@/lib/notifications/verlo-email-outbox"
import { notifyGuarantorPush } from "@/lib/guarantors/send-push"

export const runtime="nodejs"
export const dynamic="force-dynamic"
export const maxDuration=60
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/** Read access to exactly this account's own private signing link. */
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const id=req.nextUrl.searchParams.get("contractId")||""
  if(!uuid.test(id))return reply({ok:false,error:"Invalid contract"},400)
  const participants=await loadSignaturaContractParticipants(actor.db,id,actor.email,actor.user.id)
  if(!participants)return reply({ok:false,error:"Contract unavailable"},404)
  const {data:signing,error}=await actor.db.from("signatura_contract_signings")
    .select("status,document_id,document_sha256,owner_signature_id,tenant_signature_id,guarantor_signature_id")
    .eq("lead_contract_id",id).maybeSingle()
  if(error)return reply({ok:false,error:"Unavailable"},503)
  if(!signing) {
    const gate=await checkTraditionalSigningReadiness(actor.db,id,"signatura")
    return reply({ok:true,status:gate.allowed?"ready":"blocked",
      reason:gate.allowed?null:gate.reason,role:participants.role})
  }
  // Never expose signing links after a contract version has changed.
  if(!participants.contract.content ||
    createHash("sha256").update(participants.contract.content,"utf8").digest("hex")!==signing.document_sha256)
    return reply({ok:false,error:"Contract version changed; signing requires review"},409)
  // Recheck current payment, caucion, and guarantor dossier approval before
  // returning any existing signing link. Old links must not bypass revocation.
  if (signing.status === "pending") {
    const currentGate = await checkTraditionalSigningReadiness(actor.db,id,"signatura")
    if(!currentGate.allowed) return reply({ok:true,status:"blocked",reason:currentGate.reason,role:participants.role})
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
  const participants=await loadSignaturaContractParticipants(actor.db,id,actor.email,actor.user.id)
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
  // Exact signer-to-URL mapping must be proven in QA before any billable creation.
  if(process.env.SIGNATURA_SIGNER_BINDING_CERTIFIED!=="true")
    return reply({ok:false,error:"Signatura signer binding not yet certified"},503)
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
    // Never infer personal signing links from an undocumented array position.
    // Signatura must return explicit signer order; missing/duplicate orders are
    // quarantined after provider creation, NOT automatically retried.
    const returned=(created.signatures||[]) as Array<{id:string;order?:number}>
    const orders=returned.map(s=>s.order)
    if(!uuid.test(created.id||"") || returned.length!==signatures.length ||
       returned.some(s=>!uuid.test(s.id)) ||
       orders.some(order=>typeof order!=="number") ||
       new Set(orders).size!==signatures.length) {
      return reply({ok:false,error:"Signer mapping unverified; manual reconciliation required"},503)
    }
    const ids=Array.from({length:signatures.length},(_,i)=>returned.find(s=>s.order===i+1)?.id||"")
    if(ids.some(id=>!uuid.test(id)))
      return reply({ok:false,error:"Signer order invalid; manual reconciliation required"},503)
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
    if(guarantor?.auth_user_id){
      await notifyGuarantorPush(guarantor.auth_user_id,{
        title:"Tu contrato está listo para firmar",
        body:"Ingresá a Mi VERLO para validar tu identidad y firmar.",
        url:"/mi-verlo",
      }).catch(()=>undefined)
    }
    return reply({ok:true,status:"pending",contractId:id},201)
  }catch{
    // Reservation remains locked: retrying could create a second billable document.
    return reply({ok:false,error:"Unknown provider outcome; manual reconciliation required"},503)
  }
}
