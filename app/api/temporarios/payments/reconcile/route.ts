import { NextResponse } from "next/server"
import {createClient} from "@supabase/supabase-js"
import {authorizeTemporaryWrite} from "@/lib/temporarios/write-auth"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(status:number,data:object)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export async function POST(request:Request){
 const auth=await authorizeTemporaryWrite(request,"tenant")
 if("status" in auth)return reply(auth.status,{ok:false,error:auth.error})
 let body:{matchId?:unknown;paymentId?:unknown}
 try{body=await request.json()}catch{return reply(400,{ok:false,error:"Solicitud inválida"})}
 if(typeof body?.matchId!=="string"||!uuid.test(body.matchId)||typeof body.paymentId!=="string"||!/^[0-9]{1,32}$/.test(body.paymentId))return reply(400,{ok:false,error:"Datos inválidos"})
 const token=process.env.TEMPORARY_MP_ACCESS_TOKEN
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!token||!url||!service)return reply(503,{ok:false,error:"Verificación no disponible"})
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
 const match=await db.from("temporary_matches").select("id,temporary_demands!inner(tenant_user_id)").eq("id",body.matchId).eq("temporary_demands.tenant_user_id",auth.userId).maybeSingle()
 if(match.error)return reply(503,{ok:false,error:"No pudimos consultar la coincidencia"})
 if(!match.data)return reply(403,{ok:false,error:"Acceso denegado"})
 const reservation=await db.from("temporary_reservations").select("id,status").eq("match_id",body.matchId).maybeSingle()
 if(reservation.error||!reservation.data)return reply(409,{ok:false,error:"Reserva no disponible"})
 const attempts=await db.from("temporary_payment_attempts").select("id,status,mp_preference_id").eq("reservation_id",reservation.data.id).eq("tenant_user_id",auth.userId).eq("status","pending").limit(2)
 if(attempts.error||!attempts.data||attempts.data.length!==1)return reply(409,{ok:false,error:"No existe un intento pendiente único"})
 const attempt=attempts.data[0]
 if(!attempt.mp_preference_id)return reply(409,{ok:false,error:"Preferencia faltante"})
 const mp=await fetch("https://api.mercadopago.com/v1/payments/"+body.paymentId,{headers:{Authorization:"Bearer "+token},cache:"no-store"}).catch(()=>null)
 if(!mp?.ok)return reply(502,{ok:false,error:"Mercado Pago no pudo verificar esta operación",providerStatus:mp?.status||0})
 const payment=await mp.json().catch(()=>null) as {id?:number|string;status?:string;external_reference?:string;transaction_amount?:number;currency_id?:string}|null
 if(String(payment?.id)!==body.paymentId||payment?.external_reference!==attempt.id||Number(payment?.transaction_amount)!==49900||payment?.currency_id!=="ARS")return reply(409,{ok:false,error:"La operación no corresponde a esta reserva"})
 if(payment?.status!=="approved")return reply(409,{ok:false,error:"Mercado Pago todavía no confirma el pago",paymentStatus:payment?.status||"desconocido"})
 const stored=await db.rpc("temporary_register_verified_payment",{p_attempt_id:attempt.id,p_mp_payment_id:body.paymentId,p_amount:49900,p_currency:"ARS",p_mp_status:"approved"})
 if(stored.error)return reply(503,{ok:false,error:"El pago fue verificado pero no se pudo registrar"})
 return reply(200,{ok:true,verified:true,reservation:stored.data})
}

