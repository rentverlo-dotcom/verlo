import { createHash, randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getGuarantorActor, canonicalEmail } from "@/lib/guarantors/auth"
import { enqueueVerloEmailSafely } from "@/lib/notifications/verlo-email-outbox"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const BUCKET = "private-documents"
const MAX_BYTES = 10 * 1024 * 1024
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const TYPES = new Set(["application/pdf", "image/png", "image/jpeg"])
const GUARANTOR_KINDS = new Set(["deed", "identity", "income", "other"])
const OWNER_KINDS = new Set(["ownership_report", "inhibition_report"])
const decisions = new Set(["under_review", "changes_requested", "rejected", "approved"])
const reply = (body: object, code = 200) =>
  NextResponse.json(body, {status:code,headers:{"Cache-Control":"no-store"}})

async function context(req: NextRequest, id: string) {
  const actor = await getGuarantorActor(req)
  if (!actor || !UUID.test(id)) return null
  const {data:g,error} = await actor.db.from("contract_guarantors")
    .select("id,lead_contract_id,full_name,email,auth_user_id,status,guarantee_kind,legal_address,collateral_address,collateral_jurisdiction,collateral_registration,collateral_owner,review_status,document_revision,approved_revision,review_reason,reviewed_at")
    .eq("id",id).maybeSingle()
  if (error || !g) return null
  const {data:contract, error:contractError} = await actor.db.from("lead_contracts")
    .select("id,owner_lead_id,tenant_lead_id,status,owner_agreed_at,tenant_agreed_at").eq("id",g.lead_contract_id).maybeSingle()
  if (contractError || !contract) return null
  const {data:lead, error:leadError} = await actor.db.from("lead_intake")
    .select("email").eq("id",contract.owner_lead_id).maybeSingle()
  if (leadError || !lead?.email) return null
  const ownerEmail = canonicalEmail(lead.email)
  const role = actor.user.id === g.auth_user_id && actor.email === canonicalEmail(g.email) ? "guarantor"
    : actor.email === ownerEmail ? "owner" : null
  if (!role) return null
  return {actor,g,contract,role,ownerEmail}
}
async function dossier(req:NextRequest) {
  const id = req.nextUrl.searchParams.get("guarantorId") || ""
  return context(req,id)
}

function validMagic(bytes:Buffer,mime:string) {
  if(mime === "application/pdf") return bytes.subarray(0,5).equals(Buffer.from("%PDF-"))
  if(mime === "image/png") return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
  if(mime === "image/jpeg") return bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff
  return false
}
const safeName=(s:string)=>s.slice(0,160).replace(/[\r\n<>]/g," ").trim()

/** Only the invited person or this contract's owner can list private documents. */
export async function GET(req:NextRequest) {
  const ctx=await dossier(req)
  if(!ctx)return reply({ok:false,error:"Not authorized"},403)
  const {data, error} = await ctx.actor.db.from("guarantor_documents")
    .select("id,kind,original_name,mime_type,bytes,document_revision,created_at")
    .eq("guarantor_id",ctx.g.id).order("created_at",{ascending:true}).limit(80)
  if(error)return reply({ok:false,error:"Documents unavailable"},503)
  return reply({ok:true,role:ctx.role,guarantor:{
    id:ctx.g.id,fullName:ctx.g.full_name,guaranteeKind:ctx.g.guarantee_kind,
    status:ctx.g.status,reviewStatus:ctx.g.review_status,reviewReason:ctx.g.review_reason,
    documentRevision:ctx.g.document_revision,approvedRevision:ctx.g.approved_revision,
    collateralAddress:ctx.g.collateral_address,collateralJurisdiction:ctx.g.collateral_jurisdiction,
    collateralRegistration:ctx.g.collateral_registration,collateralOwner:ctx.g.collateral_owner,
  },documents:data||[]})
}

/** The 10 MB file goes directly to private Storage, not through Vercel's 4.5 MB body limit. */
export async function POST(req:NextRequest) {
  const body=await req.json().catch(()=>null)
  const id=String(body?.guarantorId||"")
  const ctx=await context(req,id)
  if(!ctx)return reply({ok:false,error:"Not authorized"},403)
  const {actor,g,role,contract}=ctx
  if(["agreed","signed"].includes(contract.status) || contract.owner_agreed_at || contract.tenant_agreed_at)
    return reply({ok:false,error:"Contract version already agreed; changes require review"},409)
  const action=String(body?.action||"")

  if(action==="details") {
    if(role!=="guarantor"||g.status!=="accepted")return reply({ok:false,error:"Guarantor consent required"},403)
    const address=String(body?.collateralAddress||"").trim().slice(0,300)
    const jurisdiction=String(body?.collateralJurisdiction||"").trim().slice(0,150)
    const registration=String(body?.collateralRegistration||"").trim().slice(0,120)
    const owner=String(body?.collateralOwner||"").trim().slice(0,200)
    if(g.guarantee_kind==="property" && (!address||!jurisdiction||!registration||!owner))
      return reply({ok:false,error:"Property registration, owner and jurisdiction required"},400)
    const {error}=await actor.db.from("contract_guarantors").update({
      collateral_address:address,collateral_jurisdiction:jurisdiction,
      collateral_registration:registration,collateral_owner:owner,
      review_status:"awaiting_documents",approved_revision:null,
      reviewed_at:null,reviewed_by_user_id:null,
      document_revision:g.document_revision+1,updated_at:new Date().toISOString(),
    }).eq("id",g.id).eq("document_revision",g.document_revision)
    if(error)return reply({ok:false,error:"Details could not be saved"},503)
    return reply({ok:true,status:"awaiting_documents"})
  }

  if(action==="presign") {
    const kind=String(body?.kind||"")
    const mime=String(body?.mimeType||"")
    const size=Number(body?.bytes||0)
    const name=safeName(String(body?.name||""))
    if(!TYPES.has(mime)||!Number.isInteger(size)||size<100||size>MAX_BYTES ||
       !name || !(role==="guarantor"?GUARANTOR_KINDS:OWNER_KINDS).has(kind))
      return reply({ok:false,error:"Invalid document type or size; PDF/JPG/PNG, max 10 MB"},400)
    if(role==="guarantor"&&g.status!=="accepted")return reply({ok:false,error:"Accept invitation first"},409)
    if(role==="owner"&&g.review_status==="awaiting_documents")return reply({ok:false,error:"Guarantor documents pending"},409)
    const ext=mime==="application/pdf"?"pdf":mime==="image/png"?"png":"jpg"
    const key="guarantors/"+g.id+"/"+randomUUID()+"."+ext
    const {data,error}=await actor.db.storage.from(BUCKET).createSignedUploadUrl(key,{upsert:false})
    if(error||!data?.token)return reply({ok:false,error:"Private upload unavailable"},503)
    return reply({ok:true,path:key,token:data.token,kind,mimeType:mime,bytes:size,name})
  }

  if(action==="confirm") {
    const key=String(body?.path||"")
    const mime=String(body?.mimeType||"")
    const kind=String(body?.kind||"")
    const size=Number(body?.bytes||0)
    const name=safeName(String(body?.name||""))
    if(!/^guarantors\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|png|jpg)$/i.test(key) ||
       !key.startsWith("guarantors/"+g.id+"/") || !TYPES.has(mime) ||
       !Number.isInteger(size)||size<100||size>MAX_BYTES ||!name ||
       !(role==="guarantor"?GUARANTOR_KINDS:OWNER_KINDS).has(kind))
      return reply({ok:false,error:"Invalid upload confirmation"},400)
    const {data:existing}=await actor.db.from("guarantor_documents")
      .select("id").eq("storage_key",key).maybeSingle()
    if(existing)return reply({ok:true,alreadyRegistered:true})
    const {data:blob,error:downloadError}=await actor.db.storage.from(BUCKET).download(key)
    if(downloadError||!blob)return reply({ok:false,error:"Uploaded object not found"},409)
    const bytes=Buffer.from(await blob.arrayBuffer())
    if(bytes.length!==size||bytes.length<100||bytes.length>MAX_BYTES||!validMagic(bytes,mime))
      return reply({ok:false,error:"Stored file failed validation"},422)
    const revision=g.document_revision+1
    const {error:insertError}=await actor.db.from("guarantor_documents").insert({
      guarantor_id:g.id,kind,storage_key:key,original_name:name,mime_type:mime,
      bytes:bytes.length,document_revision:revision,uploaded_by_user_id:actor.user.id,
    })
    if(insertError)return reply({ok:false,error:"Unable to register file"},503)
    const nextStatus=role==="guarantor"?"submitted":"under_review"
    const {error:updateError}=await actor.db.from("contract_guarantors").update({
      document_revision:revision,approved_revision:null,review_status:nextStatus,
      reviewed_at:null,reviewed_by_user_id:null,updated_at:new Date().toISOString(),
    }).eq("id",g.id).eq("document_revision",g.document_revision)
    if(updateError)return reply({ok:false,error:"File registered; manual review needed"},503)
    if(role==="guarantor"){
      await enqueueVerloEmailSafely({
        area:"tradicionales",eventType:"guarantor_documents_submitted",
        eventKey:"guarantor_documents:"+g.id+":"+revision,
        recipientEmail:ctx.ownerEmail,recipientRole:"owner",url:"/mi-verlo",
      })
      // Existing opted-in owner devices only. QA's provider guard skips delivery.
      try {
        const {sendPushToLead}=await import("@/lib/push")
        await sendPushToLead(contract.owner_lead_id,{
          title:"VERLO · Documentación de garantía disponible",
          body:"Tu garante presentó documentos. Revisalos desde Mi VERLO.",
          url:"/mi-verlo",
        })
      } catch {
        // Push is optional: the secured private dossier and email event remain durable.
      }
    }
    return reply({ok:true,status:nextStatus,revision})
  }

  if(action==="decision") {
    if(role!=="owner")return reply({ok:false,error:"Owner only"},403)
    const decision=String(body?.decision||"")
    const reason=String(body?.reason||"").trim().slice(0,800)
    if(!decisions.has(decision) || (["changes_requested","rejected"].includes(decision)&&reason.length<5))
      return reply({ok:false,error:"Decision and reason required"},400)
    if(g.status!=="accepted"||g.document_revision<1)
      return reply({ok:false,error:"Guarantor documents missing"},409)
    const {data:docs,error:docsError}=await actor.db.from("guarantor_documents")
      .select("kind").eq("guarantor_id",g.id)
    if(docsError)return reply({ok:false,error:"Documents unavailable"},503)
    const kinds=new Set((docs||[]).map((d:any)=>d.kind))
    if(decision==="approved"){
      const required=g.guarantee_kind==="property"?
        ["deed","ownership_report","inhibition_report"]:
        g.guarantee_kind==="salary"?["income"]:["identity"]
      if(required.some(k=>!kinds.has(k)))return reply({ok:false,error:"Required documentation and reports missing"},409)
      if(g.guarantee_kind==="property" &&
        (!g.collateral_address || !g.collateral_jurisdiction ||
         !g.collateral_registration || !g.collateral_owner))
        return reply({ok:false,error:"Property identification incomplete"},409)
    }
    const now=new Date().toISOString()
    const {data:updated,error:updateError}=await actor.db.from("contract_guarantors").update({
      review_status:decision,review_reason:reason||null,reviewed_at:now,
      reviewed_by_user_id:actor.user.id,
      approved_revision:decision==="approved"?g.document_revision:null,
      updated_at:now,
    }).eq("id",g.id).eq("document_revision",g.document_revision).select("id").maybeSingle()
    if(updateError||!updated)return reply({ok:false,error:"Decision not saved; review documents again"},409)
    await actor.db.from("guarantor_review_events").insert({
      guarantor_id:g.id,review_status:decision,reason:reason||null,
      actor_user_id:actor.user.id,document_revision:g.document_revision,
    })
    await enqueueVerloEmailSafely({
      area:"tradicionales",eventType:"guarantor_review_"+decision,
      eventKey:"guarantor_review:"+g.id+":"+g.document_revision+":"+decision,
      recipientEmail:g.email,recipientRole:"guarantor",url:"/mi-verlo",
    })
    if(["approved","rejected","changes_requested"].includes(decision)){
      const {data:tenant}=await actor.db.from("lead_intake").select("email")
        .eq("id",contract.tenant_lead_id).maybeSingle()
      if(tenant?.email)await enqueueVerloEmailSafely({
        area:"tradicionales",eventType:"tenant_guarantor_review_"+decision,
        eventKey:"tenant_guarantor_review:"+g.id+":"+g.document_revision+":"+decision,
        recipientEmail:tenant.email,recipientRole:"tenant",url:"/mi-verlo",
      })
      try{
        const {sendPushToLead}=await import("@/lib/push")
        await sendPushToLead(contract.tenant_lead_id,{
          title:"VERLO · Novedad sobre tu garantía",
          body:"El propietario registró una decisión sobre la garantía. Consultá Mi VERLO.",
          url:"/mi-verlo",
        })
      }catch{}
    }
    return reply({ok:true,reviewStatus:decision,revision:g.document_revision})
  }
  return reply({ok:false,error:"Unknown operation"},400)
}

/** Only the legal participants can request a short-lived read URL for documents. */
export async function PATCH(req:NextRequest) {
  const body=await req.json().catch(()=>null)
  const id=String(body?.guarantorId||"")
  const ctx=await context(req,id)
  if(!ctx)return reply({ok:false,error:"Not authorized"},403)
  const documentId=String(body?.documentId||"")
  if(!UUID.test(documentId))return reply({ok:false,error:"Invalid document"},400)
  const {data:doc,error}=await ctx.actor.db.from("guarantor_documents")
    .select("storage_key").eq("id",documentId).eq("guarantor_id",id).maybeSingle()
  if(error||!doc)return reply({ok:false,error:"Document unavailable"},404)
  const {data:signed,error:signError}=await ctx.actor.db.storage.from(BUCKET)
    .createSignedUrl(doc.storage_key,60)
  if(signError||!signed?.signedUrl)return reply({ok:false,error:"Link unavailable"},503)
  return reply({ok:true,url:signed.signedUrl,expiresInSeconds:60})
}
