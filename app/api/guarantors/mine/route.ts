import { NextRequest, NextResponse } from "next/server"
import { getGuarantorActor } from "@/lib/guarantors/auth"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(value:object,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/** Private guarantor view. Never returns a contract document before acceptance. */
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const {data,error}=await actor.db.from("contract_guarantors")
    .select("id,lead_contract_id,full_name,guarantee_kind,status,accepted_at,signed_at,auth_user_id")
    .eq("email",actor.email).limit(30)
  if(error)return reply({ok:false,error:"Unavailable"},503)
  return reply({ok:true,guarantees:(data||[])
    .filter((g:any)=>!g.auth_user_id || g.auth_user_id===actor.user.id)
    .map((g:any)=>({
      id:g.id,contractId:g.lead_contract_id,fullName:g.full_name,
      guaranteeKind:g.guarantee_kind,status:g.status,acceptedAt:g.accepted_at,
      signedAt:g.signed_at,
    }))})
}

/** The real person must accept on an independently verified account. */
export async function POST(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const body=await req.json().catch(()=>null)
  const id=String(body?.guarantorId||"")
  if(!uuid.test(id)||body?.acknowledged!==true)return reply({ok:false,error:"Explicit consent required"},400)
  const {data:guarantor,error}=await actor.db.from("contract_guarantors")
    .select("id,email,auth_user_id,status,lead_contract_id")
    .eq("id",id).eq("email",actor.email).maybeSingle()
  if(error)return reply({ok:false,error:"Unavailable"},503)
  if(!guarantor)return reply({ok:false,error:"Invitation unavailable"},404)
  if(guarantor.auth_user_id && guarantor.auth_user_id!==actor.user.id)
    return reply({ok:false,error:"Bound to another account"},403)
  if(guarantor.status==="declined")return reply({ok:false,error:"Invitation declined"},409)
  if(guarantor.status==="accepted")return reply({ok:true,status:"accepted"})
  const {data:contract, error:contractError}=await actor.db.from("lead_contracts")
    .select("status,tenant_agreed_at,owner_agreed_at").eq("id",guarantor.lead_contract_id).maybeSingle()
  if(contractError||!contract)return reply({ok:false,error:"Contract unavailable"},503)
  if(!["draft","generated"].includes(contract.status) ||
    contract.tenant_agreed_at || contract.owner_agreed_at)
    return reply({ok:false,error:"Contract has changed; invitation requires review"},409)
  const {data:updated,error:updateError}=await actor.db.from("contract_guarantors")
    .update({status:"accepted",accepted_at:new Date().toISOString(),
      auth_user_id:actor.user.id,updated_at:new Date().toISOString()})
    .eq("id",id).eq("email",actor.email).eq("status","invited")
    .is("auth_user_id",null).select("id").maybeSingle()
  if(updateError)return reply({ok:false,error:"Unable to accept"},503)
  if(!updated)return reply({ok:false,error:"Already being processed"},409)
  return reply({ok:true,status:"accepted"})
}
