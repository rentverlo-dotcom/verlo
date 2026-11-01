import { NextRequest, NextResponse } from "next/server"
import { createHash, timingSafeEqual } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { createCaucionContractPdf } from "@/lib/powermarket/contract-pdf"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function POST(req:NextRequest){
 try{
  // Internal administrative publication only. Never exposed to the partner or a public lead token.
  const configured=process.env.POWERMARKET_REVIEW_PUBLISH_SECRET
  const supplied=req.headers.get("x-powermarket-publish-secret")
  if(!configured||configured.length<32||!supplied||supplied.length!==configured.length||
   !requireSafeEqual(supplied,configured))return NextResponse.json({error:"No autorizado"},{status:403})
  const body=await req.json().catch(()=>null)
  const applicationId=String(body?.application_id||""),contractId=String(body?.lead_contract_id||"")
  if(!uuid.test(applicationId)||!uuid.test(contractId))return NextResponse.json({error:"IDs inválidos"},{status:400})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!key)return NextResponse.json({error:"Configuración ausente"},{status:503})
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:a,error:ae}=await db.from("caucion_applications").select("id,tenant_lead_id,status").eq("id",applicationId).single()
  if(ae||!a||!["prequalified","alternative_offered","under_review"].includes(a.status))
   return NextResponse.json({error:"Caución no apta para revisión"},{status:409})
  const {data:c,error:ce}=await db.from("lead_contracts").select("id,tenant_lead_id,status,content").eq("id",contractId).single()
  if(ce||!c||c.tenant_lead_id!==a.tenant_lead_id||!["generated","agreed"].includes(c.status)||!c.content)
   return NextResponse.json({error:"Contrato no apto o no asociado"},{status:409})
  const {data:history,error:he}=await db.from("caucion_contract_reviews").select("version,contract_content_sha256")
   .eq("application_id",applicationId).eq("lead_contract_id",contractId).order("version",{ascending:false}).limit(1)
  if(he)throw he
  const contentHash=createHash("sha256").update(c.content,"utf8").digest("hex")
  if(history?.[0]?.contract_content_sha256===contentHash)
   return NextResponse.json({error:"Ya existe revisión de esta versión contractual"},{status:409})
  const version=(history?.[0]?.version||0)+1
  const pdf=createCaucionContractPdf({documentText:c.content,version,sha256:contentHash,contractId})
  if(pdf.byteLength>50*1024*1024)return NextResponse.json({error:"PDF excede 50 MB"},{status:413})
  const pdfHash=createHash("sha256").update(pdf).digest("hex")
  const storageKey=`powermarket/contracts/${applicationId}/${contractId}/v${version}.pdf`
  const {data:bucket,error:be}=await db.storage.getBucket("tenant-documents")
  if(be||!bucket||bucket.public)return NextResponse.json({error:"Bucket privado no disponible"},{status:503})
  const {error:ue}=await db.storage.from("tenant-documents").upload(storageKey,pdf,{contentType:"application/pdf",upsert:false})
  if(ue)throw ue
  const {data:id,error:pe}=await db.rpc("caucion_publish_contract_review",{
   p_application_id:applicationId,p_contract_id:contractId,p_content_sha256:contentHash,
   p_pdf_sha256:pdfHash,p_private_key:storageKey,p_version:version
  })
  if(pe){console.error("Publish review failed",pe);return NextResponse.json({error:"No se registró la revisión; archivo no publicado"},{status:409})}
  return NextResponse.json({ok:true,review_id:id,version,pdf_sha256:pdfHash})
 }catch(e){console.error("PowerMarket contract publication failed",e);return NextResponse.json({error:"No se pudo publicar el contrato"},{status:500})}
}
function requireSafeEqual(a:string,b:string){
 const x=Buffer.from(a),y=Buffer.from(b)
return x.length===y.length&&timingSafeEqual(x,y)
}
