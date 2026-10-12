import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const reply=(status:number,data:object)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
const FEE=29900
type Preference={id?:string;init_point?:string;sandbox_init_point?:string;external_reference?:string;message?:string}

export async function POST(request:Request){
 const auth=await authorizeTemporaryWrite(request,"tenant")
 if("status" in auth)return reply(auth.status,{ok:false,error:auth.error})
 if(Number(request.headers.get("content-length")||0)>2048)return reply(413,{ok:false,error:"Solicitud demasiado grande"})
 let body:{matchId?:unknown}
 try{body=await request.json()}catch{return reply(400,{ok:false,error:"Solicitud inválida"})}
 if(!body||typeof body.matchId!=="string"||!uuid.test(body.matchId))return reply(400,{ok:false,error:"Coincidencia inválida"})
 const mpToken=process.env.TEMPORARY_MP_ACCESS_TOKEN
 if(!mpToken||!(mpToken.startsWith("APP_USR-")||mpToken.startsWith("TEST-")))return reply(503,{ok:false,error:"Mercado Pago de prueba no está configurado"})
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return reply(503,{ok:false,error:"Servicio no disponible"})
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const match=await db.from("temporary_matches")
  .select("id,status,tenant_decision,owner_decision,temporary_demands!inner(tenant_user_id)")
  .eq("id",body.matchId).eq("temporary_demands.tenant_user_id",auth.userId).maybeSingle()
 if(match.error)return reply(503,{ok:false,error:"No pudimos verificar la coincidencia"})
 if(!match.data)return reply(403,{ok:false,error:"Solo el inquilino puede iniciar el pago"})
 if(match.data.status!=="accepted"||match.data.tenant_decision!=="accepted"||match.data.owner_decision!=="accepted")return reply(409,{ok:false,error:"Falta aceptar la coincidencia"})
 const reservation=await db.from("temporary_reservations")
  .select("id,status,agreed_terms_owner_at,agreed_terms_tenant_at")
  .eq("match_id",body.matchId).maybeSingle()
 if(reservation.error)return reply(503,{ok:false,error:"No pudimos consultar la reserva"})
 const r=reservation.data
 if(!r||r.status!=="terms_accepted"||!r.agreed_terms_owner_at||!r.agreed_terms_tenant_at)
  return reply(409,{ok:false,error:"Ambas partes deben aceptar las condiciones antes del pago"})
 const previous=await db.from("temporary_payment_attempts")
  .select("id,mp_preference_id").eq("reservation_id",r.id).eq("status","pending").maybeSingle()
 if(previous.error)return reply(503,{ok:false,error:"No pudimos consultar el intento de pago"})
 let attempt=previous.data
 if(!attempt){
  const inserted=await db.from("temporary_payment_attempts")
   .insert({reservation_id:r.id,tenant_user_id:auth.userId,amount_ars:FEE,currency:"ARS",status:"pending"})
   .select("id,mp_preference_id").single()
  if(inserted.error||!inserted.data){
   // If concurrent requests created the same pending row, use the unique winner.
   const winner=await db.from("temporary_payment_attempts")
    .select("id,mp_preference_id").eq("reservation_id",r.id).eq("status","pending").maybeSingle()
   if(winner.error||!winner.data)return reply(503,{ok:false,error:"No pudimos preparar el pago"})
   attempt=winner.data
  }else attempt=inserted.data
 }
 if(attempt.mp_preference_id){
  const lookup=await fetch("https://api.mercadopago.com/checkout/preferences/"+encodeURIComponent(attempt.mp_preference_id),{headers:{Authorization:"Bearer "+mpToken},cache:"no-store"}).catch(()=>null)
  const existing=lookup?.ok?await lookup.json().catch(()=>null) as Preference|null:null
  if(!lookup?.ok)return reply(502,{ok:false,error:"Mercado Pago no pudo consultar la preferencia existente",providerStatus:lookup?.status||0})
  if(existing?.id!==attempt.mp_preference_id||existing?.external_reference!==attempt.id)return reply(409,{ok:false,error:"La preferencia recuperada no coincide con el intento de pago"})
  const checkoutUrl=existing.sandbox_init_point||existing.init_point
  if(!checkoutUrl)return reply(502,{ok:false,error:"La preferencia no tiene enlace de Checkout Pro"})
  return reply(200,{ok:true,prepared:true,preferenceId:attempt.mp_preference_id,checkoutUrl})
 }
 const base=new URL(request.url).origin
 // Preview-only environment, branch-scoped credential from test-credentials page, fixed fee and stable external_reference.
 const mp=await fetch("https://api.mercadopago.com/checkout/preferences",{
  method:"POST",
  headers:{Authorization:"Bearer "+mpToken,"Content-Type":"application/json","X-Idempotency-Key":attempt.id},
  body:JSON.stringify({
   items:[{id:"verlo-temporarios-fee",title:"VERLO Temporarios · Gestión de reserva",quantity:1,unit_price:FEE,currency_id:"ARS"}],
   external_reference:attempt.id,
   back_urls:{
    success:base+"/temporarios/mi-verlo",
    failure:base+"/temporarios/mi-verlo",
    pending:base+"/temporarios/mi-verlo"
   },
   metadata:{temporary_payment_attempt_id:attempt.id,temporary_reservation_id:r.id},
   statement_descriptor:"VERLO"
  }),cache:"no-store"
 }).catch(()=>null)
 if(!mp?.ok)return reply(502,{ok:false,error:"Mercado Pago no pudo preparar el pago de prueba"})
 const preference=await mp.json().catch(()=>null) as Preference|null
 if(!preference?.id||!(preference.sandbox_init_point||preference.init_point))return reply(502,{ok:false,error:"Mercado Pago no devolvió un checkout de prueba"})
 const saved=await db.from("temporary_payment_attempts")
  .update({mp_preference_id:preference.id,updated_at:new Date().toISOString()})
  .eq("id",attempt.id).eq("status","pending").is("mp_preference_id",null)
 if(saved.error)return reply(503,{ok:false,error:"No pudimos guardar la preferencia"})
 // No checkout URL returned to browser yet: webhook + payment verification are a separate QA gate.
 return reply(200,{ok:true,prepared:true,preferenceId:preference.id,checkoutUrl:preference.sandbox_init_point||preference.init_point})
}
