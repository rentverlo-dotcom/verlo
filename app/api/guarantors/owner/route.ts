import { NextRequest, NextResponse } from "next/server"
import { getGuarantorActor, canonicalEmail } from "@/lib/guarantors/auth"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(value:object,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}})

/** Owner can discover only guarantors tied to their own traditional rental contracts. */
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const {data:leads,error:leadError}=await actor.db.from("lead_intake")
    .select("id,email").ilike("email",actor.email).limit(100)
  if(leadError)return reply({ok:false,error:"Owner lookup unavailable"},503)
  const leadIds=(leads||[]).filter((x:any)=>canonicalEmail(x.email||"")===actor.email).map((x:any)=>x.id)
  if(!leadIds.length)return reply({ok:true,guarantees:[]})
  const {data:contracts,error:contractError}=await actor.db.from("lead_contracts")
    .select("id").in("owner_lead_id",leadIds).limit(100)
  if(contractError)return reply({ok:false,error:"Contract lookup unavailable"},503)
  const ids=(contracts||[]).map((c:any)=>c.id)
  if(!ids.length)return reply({ok:true,guarantees:[]})
  const {data:guarantors,error}=await actor.db.from("contract_guarantors")
    .select("id,lead_contract_id,full_name,guarantee_kind,status,review_status,document_revision,approved_revision")
    .in("lead_contract_id",ids).limit(100)
  if(error)return reply({ok:false,error:"Guarantors unavailable"},503)
  return reply({ok:true,guarantees:(guarantors||[]).map((g:any)=>({
    id:g.id,contractId:g.lead_contract_id,fullName:g.full_name,
    guaranteeKind:g.guarantee_kind,status:g.status,
    reviewStatus:g.review_status,documentRevision:g.document_revision,
    approvedRevision:g.approved_revision,
  }))})
}
