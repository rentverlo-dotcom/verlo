import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export const runtime="nodejs"
export const dynamic="force-dynamic"
export async function GET(request:NextRequest){
 try {
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/,"")
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!token||!url||!anon||!service)return NextResponse.json({ok:false,error:"No autorizado"},{status:401})
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:session,error:userError}=await auth.auth.getUser(token)
  const email=session.user?.email?.trim().toLowerCase()
  if(userError||!session.user?.email_confirmed_at||!email)return NextResponse.json({ok:false,error:"No autorizado"},{status:401})
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:leads,error:leadError}=await db.from("lead_intake").select("id").eq("role","tenant").ilike("email",email).limit(250)
  if(leadError)throw leadError
  const ids=(leads||[]).map((row:{id:string})=>row.id)
  if(ids.length===0)return NextResponse.json({ok:true,applications:[]})
  const {data,error}=await db.from("caucion_applications")
   .select("id,status,requested_rent_ars,estimated_expenses_ars,approved_max_total_ars,approved_max_rent_ars,decision_expires_at,submitted_at,decided_at,created_at")
   .in("tenant_lead_id",ids).neq("status","draft").order("created_at",{ascending:false}).limit(100)
  if(error)throw error
  return NextResponse.json({ok:true,applications:data||[]},{headers:{"Cache-Control":"no-store"}})
 }catch(err){console.error("My caucion status failed",err);return NextResponse.json({ok:false,error:"No se pudo consultar tu caución"},{status:500})}
}
