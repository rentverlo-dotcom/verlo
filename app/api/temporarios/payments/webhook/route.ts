import {createHmac,timingSafeEqual} from "node:crypto"
import {NextRequest,NextResponse} from "next/server"
import {createClient} from "@supabase/supabase-js"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(status:number,data:object)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validSignature(request:NextRequest,id:string,secret:string){
 const signature=request.headers.get("x-signature")||""
 const requestId=request.headers.get("x-request-id")||""
 const parts=Object.fromEntries(signature.split(",").map(part=>part.trim().split("=",2)))
 const ts=parts.ts,v1=parts.v1
 if(!ts||!/^[0-9]+$/.test(ts)||!v1||!/^[a-f0-9]{64}$/i.test(v1)||!requestId)return false
 // Mercado Pago signature manifest per payment notification docs.
 const manifest="id:"+id.toLowerCase()+";request-id:"+requestId+";ts:"+ts+";"
 const expected=createHmac("sha256",secret).update(manifest).digest()
 const received=Buffer.from(v1,"hex")
 return received.length===expected.length&&timingSafeEqual(expected,received)
}
export async function POST(request:NextRequest){
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feature/temporarios")return reply(404,{ok:false})
 const secret=process.env.TEMPORARY_MP_WEBHOOK_SECRET
 const token=process.env.TEMPORARY_MP_ACCESS_TOKEN
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!secret||!(token?.startsWith("APP_USR-")||token?.startsWith("TEST-"))||!url||!service)return reply(503,{ok:false,error:"Webhook de prueba no configurado"})
 if(Number(request.headers.get("content-length")||0)>8192)return reply(413,{ok:false})
 let body:{type?:unknown;data?:{id?:unknown}}
 try{body=await request.json()}catch{return reply(400,{ok:false})}
 const kind=body?.type||request.nextUrl.searchParams.get("type")
 const queryId=request.nextUrl.searchParams.get("data.id")
 const bodyId=body?.data?.id
 const id=typeof queryId==="string"?queryId:typeof bodyId==="string"?bodyId:String(bodyId??"")
 if(kind!=="payment")return reply(200,{ok:true,ignored:true})
 if(!/^[0-9]{1,32}$/.test(id))return reply(400,{ok:false,error:"Id inválido"})
 if(!validSignature(request,id,secret))return reply(401,{ok:false,error:"Firma inválida"})
 const response=await fetch("https://api.mercadopago.com/v1/payments/"+encodeURIComponent(id),{headers:{Authorization:"Bearer "+token},cache:"no-store"}).catch(()=>null)
 if(!response?.ok)return reply(503,{ok:false,error:"No se pudo verificar el pago"})
 const payment=await response.json().catch(()=>null) as {id?:string|number;external_reference?:string;status?:string;transaction_amount?:number;currency_id?:string;order?:{id?:string}}|null
 const attemptId=payment?.external_reference
 if(!attemptId||!uuid.test(attemptId))return reply(200,{ok:true,ignored:true})
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
 const attempt=await db.from("temporary_payment_attempts").select("id,reservation_id,amount_ars,currency,status,mp_preference_id").eq("id",attemptId).maybeSingle()
 if(attempt.error)return reply(503,{ok:false,error:"No se pudo verificar el intento"})
 if(!attempt.data)return reply(200,{ok:true,ignored:true})
 // Compare payment account data against our pending sandbox preference.
 if(!attempt.data.mp_preference_id)return reply(409,{ok:false,error:"Preferencia no registrada"})
 if(Number(payment?.id)!==Number(id)||Number(payment?.transaction_amount)!==49900||payment?.currency_id!=="ARS")return reply(409,{ok:false,error:"Pago no coincide"})
 const status=payment?.status
 if(typeof status!=="string"||!["approved","rejected","cancelled","pending","in_process"].includes(status))return reply(200,{ok:true,ignored:true})
 const result=await db.rpc("temporary_register_verified_payment",{
  p_attempt_id:attemptId,p_mp_payment_id:id,p_amount:49900,p_currency:"ARS",p_mp_status:status
 })
 if(result.error)return reply(503,{ok:false,error:"No se pudo registrar la verificación"})
 return reply(200,{ok:true,status,verified:true})
}
