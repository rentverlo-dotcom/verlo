import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"
import { getTemporaryStorageConfig } from "@/lib/temporarios/storage-config"
import { signTemporaryObject } from "@/lib/temporarios/r2-signer"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(status:number,body:object)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i
const allowed=new Set(["image/jpeg","image/png","image/webp","video/mp4"])
export async function POST(request:Request){
  const auth=await authorizeTemporaryWrite(request,"owner")
  if("status" in auth)return reply(auth.status,{ok:false,error:auth.error})
  const config=getTemporaryStorageConfig(process.env)
  if(!config||process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios")
    return reply(503,{ok:false,error:"Almacenamiento temporal no habilitado"})
  let input:{propertyId?:unknown;mimeType?:unknown;bytes?:unknown}
  try{input=await request.json()}catch{return reply(400,{ok:false,error:"Solicitud inválida"})}
  if(!input||typeof input.propertyId!=="string"||!uuid.test(input.propertyId)||
    typeof input.mimeType!=="string"||!allowed.has(input.mimeType)||
    typeof input.bytes!=="number"||!Number.isSafeInteger(input.bytes)||input.bytes<1||input.bytes>20971520)
    return reply(400,{ok:false,error:"Archivo inválido (máximo 20 MB)"})
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
  const [property,media]=await Promise.all([
    db.from("temporary_properties").select("id").eq("id",input.propertyId).eq("owner_user_id",auth.userId).maybeSingle(),
    db.from("temporary_property_media").select("id",{count:"exact",head:true}).eq("property_id",input.propertyId),
  ])
  if(property.error||!property.data)return reply(403,{ok:false,error:"Propiedad no autorizada"})
  if(media.error)return reply(503,{ok:false,error:"No se pudo verificar la galería"})
  if((media.count||0)>=12)return reply(409,{ok:false,error:"Máximo 12 archivos por propiedad"})
  const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4"} as Record<string,string>)[input.mimeType]
  const objectKey="properties/"+input.propertyId+"/"+randomUUID()+"."+ext
  const signed=signTemporaryObject(config,"PUT",objectKey)
  return reply(200,{ok:true,uploadUrl:signed.url,objectKey,expiresIn:120})
}
