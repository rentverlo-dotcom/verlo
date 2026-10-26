import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"
import { evaluateTemporaryMatch, type TemporaryPropertyType } from "@/lib/temporarios/matching"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const reply = (status: number, data: object) => NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})

// QA only: one explicitly selected pair. No automatic backfill, notifications or reservation blocks.
export async function POST(request:Request) {
  const auth = await authorizeTemporaryWrite(request,"owner")
  if ("status" in auth) return reply(auth.status,{ok:false,error:auth.error})
  let body: {propertyId?:unknown;demandId?:unknown}
  try { body = await request.json() } catch {return reply(400,{ok:false,error:"Datos inválidos"})}
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (typeof body?.propertyId !== "string" || typeof body?.demandId !== "string" ||
    !uuid.test(body.propertyId) || !uuid.test(body.demandId))
    return reply(400,{ok:false,error:"Identificadores inválidos"})

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!secret) return reply(503,{ok:false,error:"Servicio no configurado"})
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
  const [p,d,b,existing]=await Promise.all([
    db.from("temporary_properties").select("id,owner_user_id,locality_key,property_type,nightly_price_ars,availability_start,availability_end,max_guests,status").eq("id",body.propertyId).single(),
    db.from("temporary_demands").select("id,tenant_user_id,locality_keys,property_type,check_in,check_out,max_total_budget_ars,guests,status").eq("id",body.demandId).single(),
    db.from("temporary_availability_blocks").select("check_in,check_out").eq("property_id",body.propertyId).limit(500),
    db.from("temporary_matches").select("id").eq("property_id",body.propertyId).eq("demand_id",body.demandId).maybeSingle(),
  ])
  if(p.error||d.error||b.error||existing.error||!p.data||!d.data)
    return reply(404,{ok:false,error:"No se pudo verificar la coincidencia"})
  if(p.data.owner_user_id !== auth.userId || d.data.tenant_user_id !== auth.userId)
    return reply(403,{ok:false,error:"Esta operación requiere datos QA del usuario autorizado"})
  if(existing.data) return reply(200,{ok:true,id:existing.data.id,reused:true})
  if(p.data.status!=="published"||d.data.status!=="active")
    return reply(409,{ok:false,error:"La publicación o búsqueda no está activa"})
  if((b.data||[]).length===500)
    return reply(409,{ok:false,error:"Demasiados bloqueos para verificar la disponibilidad"})
  const decision=evaluateTemporaryMatch({
    localityKeys:d.data.locality_keys,propertyType:d.data.property_type as TemporaryPropertyType,
    checkIn:d.data.check_in,checkOut:d.data.check_out,maxTotalBudgetArs:Number(d.data.max_total_budget_ars),guests:d.data.guests,
  },{
    localityKey:p.data.locality_key,propertyType:p.data.property_type as TemporaryPropertyType,
    nightlyPriceArs:Number(p.data.nightly_price_ars),availabilityStart:p.data.availability_start,
    availabilityEnd:p.data.availability_end,maxGuests:p.data.max_guests,status:"published",
  },(b.data||[]).map(x=>({checkIn:x.check_in,checkOut:x.check_out})))
  if(!decision.compatible) return reply(409,{ok:false,error:"La coincidencia ya no cumple los requisitos",reason:"reason" in decision ? decision.reason : "not_compatible"})
  const {data,error}=await db.from("temporary_matches").insert({
    property_id:p.data.id,demand_id:d.data.id,check_in:d.data.check_in,check_out:d.data.check_out,
    agreed_total_ars:decision.totalPriceArs,status:"new",
  }).select("id").single()
  if(error?.code==="23505"){
    const previous=await db.from("temporary_matches").select("id").eq("property_id",p.data.id).eq("demand_id",d.data.id).maybeSingle()
    if(previous.data) return reply(200,{ok:true,id:previous.data.id,reused:true})
  }
  if(error||!data) return reply(503,{ok:false,error:"No se pudo registrar la coincidencia"})
  return reply(201,{ok:true,id:data.id,reused:false})
}
