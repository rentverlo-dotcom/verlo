import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "node:crypto"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(req:NextRequest){
 try{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, key=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!anon||!key)throw Error("Supabase configuration missing")
  const token=(req.headers.get("authorization")||"").replace(/^Bearer /,"").trim()
  if(!token)return NextResponse.json({error:"No autorizado"},{status:403})
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:user}=await auth.auth.getUser(token)
  if(!user.user)return NextResponse.json({error:"No autorizado"},{status:403})
  const {data:partner}=await db.from("caucion_partner_users").select("active").eq("user_id",user.user.id).eq("partner","powermarket").maybeSingle()
  if(!partner?.active)return NextResponse.json({error:"No autorizado"},{status:403})
  const body=await req.json().catch(()=>null)
  const reviewId=String(body?.review_id||"")
  if(!/^[a-f0-9-]{36}$/i.test(reviewId))return NextResponse.json({error:"Revisión inválida"},{status:400})
  const {data:r,error:e}=await db.from("caucion_contract_reviews").select("id,application_id,lead_contract_id,contract_content_sha256,private_pdf_key,storage_provider,status").eq("id",reviewId).single()
  if(e||!r)return NextResponse.json({error:"Revisión inexistente"},{status:404})
  if(r.storage_provider!=="supabase"||!r.private_pdf_key.startsWith(`powermarket/contracts/${r.application_id}/`)||!r.private_pdf_key.endsWith(".pdf"))
   return NextResponse.json({error:"Ruta de PDF inválida"},{status:409})
  if(r.status==="superseded")return NextResponse.json({error:"Esta versión ya fue reemplazada"},{status:409})
  const {data:contract,error:contractError}=await db.from("lead_contracts").select("content").eq("id",r.lead_contract_id).single()
  if(contractError||typeof contract?.content!=="string")
   return NextResponse.json({error:"Contrato no disponible"},{status:409})
  const currentHash=createHash("sha256").update(contract.content,"utf8").digest("hex")
  if(currentHash!==r.contract_content_sha256)
   return NextResponse.json({error:"El contrato cambió. Se necesita publicar una nueva versión"},{status:409})
  const {data:b,error:be}=await db.storage.getBucket("tenant-documents")
  if(be||!b||b.public)return NextResponse.json({error:"Almacenamiento privado no disponible"},{status:503})
  const {data:s,error:se}=await db.storage.from("tenant-documents").createSignedUrl(r.private_pdf_key,60)
  if(se||!s?.signedUrl)return NextResponse.json({error:"No se pudo abrir el contrato"},{status:500})
  return NextResponse.json({ok:true,url:s.signedUrl,expires_seconds:60},{headers:{"Cache-Control":"no-store"}})
 }catch(e){console.error("PowerMarket contract PDF failed",e);return NextResponse.json({error:"No se pudo consultar el contrato"},{status:500})}
}
