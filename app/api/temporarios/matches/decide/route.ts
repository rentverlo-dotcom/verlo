import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const respond = (status:number, value:object) => NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Only authenticated owner or tenant can decide their own side.
// The SECURITY DEFINER database function locks the row and verifies the actor again.
export async function POST(request:Request){
  const auth=await authorizeTemporaryWrite(request,"owner")
  if("status" in auth)return respond(auth.status,{ok:false,error:auth.error})
  let body:{matchId?:unknown;role?:unknown;decision?:unknown}
  try{body=await request.json()}catch{return respond(400,{ok:false,error:"Solicitud inválida"})}
  if(!body||typeof body.matchId!=="string"||!uuid.test(body.matchId)||
    (body.role!=="owner"&&body.role!=="tenant")||
    (body.decision!=="accepted"&&body.decision!=="rejected"))
    return respond(400,{ok:false,error:"Decisión inválida"})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!service)return respond(503,{ok:false,error:"Servicio no disponible"})
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data,error}=await db.rpc("temporary_decide_match",{
    p_match_id:body.matchId,p_actor_id:auth.userId,p_role:body.role,p_decision:body.decision,
  })
  if(error){
    if(error.message.includes("not_authorized"))return respond(403,{ok:false,error:"No podés decidir por este usuario"})
    if(error.message.includes("match_closed")||error.message.includes("decision_locked")||
       error.message.includes("invalid_match_status"))return respond(409,{ok:false,error:"La decisión ya no se puede modificar"})
    return respond(503,{ok:false,error:"No se pudo registrar la decisión"})
  }
  return respond(200,{ok:true,match:data})
}
