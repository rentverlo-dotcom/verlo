import {NextResponse} from "next/server"
import {createClient} from "@supabase/supabase-js"
import {authorizeTemporaryWrite} from "@/lib/temporarios/write-auth"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(status:number,v:object)=>NextResponse.json(v,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export async function POST(request:Request){
 const auth=await authorizeTemporaryWrite(request,"owner")
 if("status" in auth)return reply(auth.status,{ok:false,error:auth.error})
 let input:{matchId?:unknown;role?:unknown}
 try{input=await request.json()}catch{return reply(400,{ok:false,error:"Solicitud inválida"})}
 if(!input||typeof input.matchId!=="string"||!uuid.test(input.matchId)|| (input.role!=="owner"&&input.role!=="tenant"))return reply(400,{ok:false,error:"Solicitud inválida"})
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!service)return reply(503,{ok:false,error:"Servicio no disponible"})
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data,error}=await db.rpc("temporary_accept_reservation_terms",{p_match_id:input.matchId,p_actor_id:auth.userId,p_role:input.role})
 if(error){
  if(error.message.includes("not_authorized"))return reply(403,{ok:false,error:"No tenés permiso para aceptar por esta parte"})
  if(error.message.includes("reservation_not_found"))return reply(409,{ok:false,error:"Primero hay que iniciar el borrador de reserva"})
  if(error.message.includes("not_eligible")||error.message.includes("terms_changed"))return reply(409,{ok:false,error:"Las condiciones de esta reserva ya no se pueden aceptar"})
  return reply(503,{ok:false,error:"No pudimos registrar tu aceptación"})
 }
 return reply(200,{ok:true,reservation:data})
}
