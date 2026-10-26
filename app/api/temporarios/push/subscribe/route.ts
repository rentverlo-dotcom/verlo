import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export const runtime = "nodejs"
export async function POST(request: NextRequest) {
  if (process.env.TEMPORARY_PUBLIC_ENABLED !== "true") return NextResponse.json({ok:false,error:"Unavailable"},{status:404})
  const token = request.headers.get("authorization")?.replace(/^Bearer /,"")
  const endpointBody = await request.json().catch(()=>null)
  const subscription = endpointBody?.subscription
  if (!token || typeof subscription?.endpoint !== "string" || !subscription.endpoint.startsWith("https://") || typeof subscription?.keys?.p256dh !== "string" || typeof subscription?.keys?.auth !== "string") return NextResponse.json({ok:false,error:"Invalid subscription"},{status:400})
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ok:false,error:"Unavailable"},{status:503})
  const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error} = await db.auth.getUser(token)
  if (error || !user) return NextResponse.json({ok:false,error:"Unauthorized"},{status:401})
  const {error:writeError} = await db.from("temporary_push_subscriptions").upsert({user_id:user.id,endpoint:subscription.endpoint,p256dh:subscription.keys.p256dh,auth:subscription.keys.auth,user_agent:request.headers.get("user-agent"),revoked_at:null,updated_at:new Date().toISOString()},{onConflict:"endpoint"})
  if (writeError) return NextResponse.json({ok:false,error:"Subscription storage unavailable"},{status:503})
  return NextResponse.json({ok:true})
}
