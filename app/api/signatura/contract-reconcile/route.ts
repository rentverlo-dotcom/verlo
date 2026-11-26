import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { getGuarantorActor } from "@/lib/guarantors/auth"
import { loadSignaturaContractParticipants } from "@/lib/signatura/contract-access"
import { getSignaturaDocument, downloadSignaturaEvidence } from "@/lib/signatura/client"

export const runtime="nodejs"
export const dynamic="force-dynamic"
export const maxDuration=60
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/** Authenticated, explicit reconciliation. Webhook alone cannot mark a contract signed. */
export async function POST(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const body=await req.json().catch(()=>null)
  const id=String(body?.contractId||"")
  if(!uuid.test(id))return reply({ok:false,error:"Invalid contract"},400)
  const participants=await loadSignaturaContractParticipants(actor.db,id,actor.email,actor.user.id)
  if(!participants)return reply({ok:false,error:"Contract unavailable"},404)
  const {data:record,error:lookupError}=await actor.db.from("signatura_contract_signings")
    .select("id,document_id,document_sha256,status,owner_signature_id,tenant_signature_id,guarantor_signature_id,guarantor_email,archived_pdf_key")
    .eq("lead_contract_id",id).maybeSingle()
  if(lookupError)return reply({ok:false,error:"Unavailable"},503)
  if(!record)return reply({ok:true,status:"not_started"})
  if(record.status==="completed")return reply({ok:true,status:"completed"})
  if(record.status!=="pending"||!record.document_id)
    return reply({ok:false,error:"Manual reconciliation required"},409)
  const contract=participants.contract
  if(!contract.content || createHash("sha256").update(contract.content,"utf8").digest("hex")!==record.document_sha256)
    return reply({ok:false,error:"Contract document version changed"},409)
  if(record.guarantor_email && (!participants.guarantor ||
    participants.guarantor.status!=="accepted" ||
    participants.guarantor.email!==record.guarantor_email))
    return reply({ok:false,error:"Guarantor status mismatch"},409)
  const signerIds=[
    record.owner_signature_id,record.tenant_signature_id,
    ...(record.guarantor_email?[record.guarantor_signature_id]:[]),
  ]
  if(signerIds.some(id=>!id||!uuid.test(id)))return reply({ok:false,error:"Unbound signer"},409)

  // Require independently HMAC-verified durable DS webhook events for ALL signers.
  const {data:events,error:eventError}=await actor.db.from("signatura_webhook_events")
    .select("signature_id").eq("document_id",record.document_id)
    .eq("notification_action","DS").in("signature_id",signerIds)
  if(eventError)return reply({ok:false,error:"Webhook evidence unavailable"},503)
  if(!signerIds.every(id=>(events||[]).some((event:any)=>event.signature_id===id)))
    return reply({ok:true,status:"pending",reason:"signer_webhook_pending"})

  let pdf:Buffer
  try{
    const document=await getSignaturaDocument(record.document_id)
    if(document.id!==record.document_id || document.status!=="CO")
      return reply({ok:true,status:"pending",reason:"provider_not_completed"})
    if(!signerIds.every(id=>{
      const signer=document.signatures?.find(s=>s.id===id)
      const validation=(signer as typeof signer & {validations?:{BI?:{validated?:boolean}}})?.validations
      return signer?.status==="CO" && validation?.BI?.validated===true
    }))return reply({ok:true,status:"pending",reason:"biometrics_not_confirmed"})
    pdf=await downloadSignaturaEvidence(record.document_id,"document")
  }catch{
    return reply({ok:false,error:"Provider verification unavailable"},502)
  }
  if(pdf.length<100 || pdf.length>50*1024*1024 ||
    !pdf.subarray(0,5).equals(Buffer.from("%PDF-")))
    return reply({ok:false,error:"Signed PDF invalid"},502)

  const path=`signatura/contracts/${id}/${record.document_id}-signed.pdf`
  const bucket=actor.db.storage.from("private-documents")
  const {error:uploadError}=await bucket.upload(path,pdf,{
    contentType:"application/pdf",cacheControl:"private, no-store",upsert:false,
  })
  if(uploadError){
    // A prior save could have succeeded with the DB update interrupted.
    // Only the same deterministic key may be reconciled; never overwrite.
    const {data:existing}=await bucket.createSignedUrl(path,60)
    if(!existing?.signedUrl)return reply({ok:false,error:"Private archive unavailable"},503)
  }
  const {data:updated,error:updateError}=await actor.db.from("signatura_contract_signings")
    .update({status:"completed",completed_at:new Date().toISOString(),
      archived_pdf_key:path,updated_at:new Date().toISOString()})
    .eq("id",record.id).eq("status","pending")
    .eq("document_id",record.document_id).eq("document_sha256",record.document_sha256)
    .select("id").maybeSingle()
  if(updateError)return reply({ok:false,error:"Archive recorded but completion needs review"},503)
  if(record.guarantor_email && participants.guarantor){
    const {error:guarantorError}=await actor.db.from("contract_guarantors")
      .update({signed_at:new Date().toISOString(),updated_at:new Date().toISOString()})
      .eq("id",participants.guarantor.id).eq("lead_contract_id",id).eq("status","accepted")
    if(guarantorError) return reply({ok:false,error:"Signed contract archived; guarantor synchronization pending"},503)
  }
  return reply({ok:true,status:updated?"completed":"already_processed"})
}
