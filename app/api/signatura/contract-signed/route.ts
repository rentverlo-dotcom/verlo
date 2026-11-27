import { NextRequest, NextResponse } from "next/server"
import { getGuarantorActor } from "@/lib/guarantors/auth"
import { loadSignaturaContractParticipants } from "@/lib/signatura/contract-access"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

/** On-demand 60s download URL, not a 60s expiry on the signed contract itself. */
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  const id=req.nextUrl.searchParams.get("contractId")||""
  if(!uuid.test(id))return reply({ok:false,error:"Invalid contract"},400)
  const participant=await loadSignaturaContractParticipants(actor.db,id,actor.email,actor.user.id)
  if(!participant)return reply({ok:false,error:"Contract unavailable"},404)
  const {data:record,error}=await actor.db.from("signatura_contract_signings")
    .select("status,archived_pdf_key").eq("lead_contract_id",id).maybeSingle()
  if(error)return reply({ok:false,error:"Archive unavailable"},503)
  if(!record || record.status!=="completed" || !record.archived_pdf_key)
    return reply({ok:false,error:"Signed contract not yet archived"},404)
  const expectedPrefix=`signatura/contracts/${id}/`
  if(!record.archived_pdf_key.startsWith(expectedPrefix) ||
    !record.archived_pdf_key.endsWith("-signed.pdf"))
    return reply({ok:false,error:"Invalid archive path"},503)
  const {data,error:linkError}=await actor.db.storage.from("private-documents")
    .createSignedUrl(record.archived_pdf_key,60)
  if(linkError||!data?.signedUrl)return reply({ok:false,error:"Download unavailable"},503)
  return reply({ok:true,url:data.signedUrl,expiresInSeconds:60})
}
