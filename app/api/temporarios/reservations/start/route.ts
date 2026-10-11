import {NextResponse} from "next/server"
import {createClient} from "@supabase/supabase-js"
import {authorizeTemporaryWrite} from "@/lib/temporarios/write-auth"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(status:number,value:object)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export async function POST(request:Request){
 const auth=await authorizeTemporaryWrite(request,"owner")
 if("status" in auth)return reply(auth.status,{ok:false,error:auth.error})
 let input:{matchId?:unknown}
 try{input=await request.json()}catch{return reply(400,{ok:false,error:"Solicitud inválida"})}
 if(typeof input?.matchId!=="string"||!uuid.test(input.matchId))return reply(400,{ok:false,error:"Coincidencia inválida"})
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return reply(503,{ok:false,error:"Servicio no disponible"})
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data,error}=await db.rpc("temporary_start_reservation",{p_match_id:input.matchId,p_actor_id:auth.userId})
 if(error){
  if(error.message.includes("not_authorized"))return reply(403,{ok:false,error:"No tenés acceso a esta coincidencia"})
  if(error.message.includes("deposit_terms_required"))return reply(409,{ok:false,error:"Esta propiedad requiere acordar las condiciones de la seña antes de iniciar la reserva"})
  if(error.message.includes("dates_unavailable"))return reply(409,{ok:false,error:"Esas fechas ya no están disponibles"})
  if(error.message.includes("match_not_accepted")||error.message.includes("listing_not_active")||error.message.includes("invalid_dates"))return reply(409,{ok:false,error:"La coincidencia ya no está lista para reservar"})
  return reply(503,{ok:false,error:"No se pudo iniciar la reserva"})
 }
 return reply(200,{ok:true,reservation:data})
}
