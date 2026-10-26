import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"
import { getTemporaryStorageConfig } from "@/lib/temporarios/storage-config"
import { signTemporaryObject } from "@/lib/temporarios/r2-signer"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const response=(status:number,body:object)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}})
const allowed=new Set(["image/jpeg","image/png","image/webp","video/mp4"])
const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i
export async function POST(request:Request){
  const auth=await authorizeTemporaryWrite(request,"owner")
  if("status" in auth)return response(auth.status,{ok:false,error:auth.error})
  const config=getTemporaryStorageConfig(process.env)
  if(!config||process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios")
    return response(503,{ok:false,error:"Almacenamiento no disponible"})
  let input:{propertyId?:unknown;objectKey?:unknown;mimeType?:unknown;bytes?:unknown}
  try{input=await request.json()}catch{return response(400,{ok:false,error:"Datos inválidos"})}
  if(!input||typeof input.propertyId!=="string"||!uuid.test(input.propertyId)||
    typeof input.objectKey!=="string"||
    !new RegExp("^properties/"+input.propertyId.replace(/[.*+?^$()|[\]{}]/g,"\\$&")+"/[0-9a-f-]{36}\\.(jpg|png|webp|mp4)$","i").test(input.objectKey)||
    typeof input.mimeType!=="string"||!allowed.has(input.mimeType)||
    typeof input.bytes!=="number"||!Number.isSafeInteger(input.bytes)||input.bytes<1||input.bytes>20971520)
    return response(400,{ok:false,error:"Archivo inválido"})
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
  const property=await db.from("temporary_properties").select("id").eq("id",input.propertyId).eq("owner_user_id",auth.userId).maybeSingle()
  if(property.error||!property.data)return response(403,{ok:false,error:"Propiedad no autorizada"})
  const head=signTemporaryObject(config,"HEAD",input.objectKey)
  let object:Response
  try{object=await fetch(head.url,{method:"HEAD",cache:"no-store"})}catch{return response(503,{ok:false,error:"No se pudo verificar el archivo en R2"})}
  if(!object.ok)return response(409,{ok:false,error:"El archivo todavía no está disponible en R2"})
  const size=Number(object.headers.get("content-length"))
  const mime=(object.headers.get("content-type")||"").split(";")[0].toLowerCase()
  if(size!==input.bytes||size<1||size>20971520||mime!==input.mimeType)
    return response(409,{ok:false,error:"El archivo no coincide con los datos enviados"})
  const existing=await db.from("temporary_property_media").select("id").eq("object_key",input.objectKey).maybeSingle()
  if(existing.error)return response(503,{ok:false,error:"No se pudo verificar la galería"})
  if(existing.data)return response(200,{ok:true,id:existing.data.id,reused:true})
  const count=await db.from("temporary_property_media").select("id",{count:"exact",head:true}).eq("property_id",input.propertyId)
  if(count.error)return response(503,{ok:false,error:"No se pudo verificar la galería"})
  if((count.count||0)>=12)return response(409,{ok:false,error:"Máximo 12 archivos"})
  const saved=await db.from("temporary_property_media").insert({
    property_id:input.propertyId,object_key:input.objectKey,mime_type:mime,bytes:size,
  }).select("id").single()
  if(saved.error?.code==="23505"){
    const previous=await db.from("temporary_property_media").select("id").eq("object_key",input.objectKey).maybeSingle()
    if(previous.data)return response(200,{ok:true,id:previous.data.id,reused:true})
  }
  if(saved.error||!saved.data)return response(503,{ok:false,error:"No se pudo guardar el archivo"})
  return response(201,{ok:true,id:saved.data.id})
}
