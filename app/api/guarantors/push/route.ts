import { NextRequest, NextResponse } from "next/server"
import { getGuarantorActor } from "@/lib/guarantors/auth"
export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}})

async function isInvited(db:any,email:string,userId:string) {
  const {data,error}=await db.from("contract_guarantors").select("id")
    .eq("email",email).in("status",["invited","accepted"]).limit(1)
  if(error)return false
  return (data||[]).length>0
}
export async function GET(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  if(!await isInvited(actor.db,actor.email,actor.user.id))
    return reply({ok:false,error:"Not a guarantor"},403)
  const endpoint=req.nextUrl.searchParams.get("endpoint")||""
  if(!endpoint||endpoint.length>2048)return reply({ok:false,error:"Invalid subscription"},400)
  const {data,error}=await actor.db.from("guarantor_push_subscriptions")
    .select("id").eq("auth_user_id",actor.user.id)
    .eq("endpoint",endpoint).is("revoked_at",null).maybeSingle()
  if(error)return reply({ok:false,error:"Unavailable"},503)
  return reply({ok:true,active:!!data})
}
export async function POST(req:NextRequest) {
  const actor=await getGuarantorActor(req)
  if(!actor)return reply({ok:false,error:"Unauthorized"},401)
  if(!await isInvited(actor.db,actor.email,actor.user.id))
    return reply({ok:false,error:"No guarantor invitation"},403)
  const body=await req.json().catch(()=>null)
  if(body?.acknowledged!==true)
    return reply({ok:false,error:"Explicit push subscription required"},400)
  const sub=body?.subscription
  const endpoint=String(sub?.endpoint||"")
  const p256dh=String(sub?.keys?.p256dh||"")
  const auth=String(sub?.keys?.auth||"")
  let validEndpoint=false
  try{const u=new URL(endpoint);validEndpoint=u.protocol==="https:"&&!u.username&&!u.password}catch{}
  if(!validEndpoint||endpoint.length>2048||
     !/^[a-zA-Z0-9_-]{30,256}$/.test(p256dh) ||
     !/^[a-zA-Z0-9_-]{12,256}$/.test(auth))
    return reply({ok:false,error:"Invalid push subscription"},400)
  // Prevent silently stealing an endpoint registered by a different account.
  const {data:existing,error:lookupError}=await actor.db.from("guarantor_push_subscriptions")
    .select("id,auth_user_id").eq("endpoint",endpoint).maybeSingle()
  if(lookupError)return reply({ok:false,error:"Unavailable"},503)
  if(existing && existing.auth_user_id!==actor.user.id)
    return reply({ok:false,error:"Subscription belongs to another account"},409)
  const now=new Date().toISOString()
  const {error}=await actor.db.from("guarantor_push_subscriptions")
    .upsert({auth_user_id:actor.user.id,endpoint,p256dh,auth,
      user_agent:req.headers.get("user-agent"),revoked_at:null,updated_at:now},
      {onConflict:"endpoint"})
  if(error)return reply({ok:false,error:"Cannot save subscription"},503)
  // No welcome message or provider dispatch in isolated QA.
  return reply({ok:true,registered:true,deliveryAttempted:false})
}
