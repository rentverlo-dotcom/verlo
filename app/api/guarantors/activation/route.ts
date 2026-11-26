import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const reply=(v:object,s=200)=>NextResponse.json(v,{status:s,headers:{"Cache-Control":"no-store"}})

export async function POST(req:NextRequest){
 const qa=process.env.VERCEL_ENV==="preview" &&
   process.env.VERCEL_GIT_COMMIT_REF==="feature/signatura-qa-integration" &&
   process.env.NEXT_PUBLIC_SUPABASE_URL==="https://anptswspguyotnasoacq.supabase.co"
 const prod=process.env.VERCEL_ENV==="production" &&
   process.env.VERLO_GUARANTOR_INVITES_LIVE==="true"
 if(!qa&&!prod)return reply({ok:false,error:"Unavailable"},404)
 const body=await req.json().catch(()=>null)
 const invitation=String(body?.invitation||"")
 const email=String(body?.email||"").trim().toLowerCase()
 if(!/^[0-9a-f]{64}$/.test(invitation)||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
   return reply({ok:false,error:"Invitación inválida"},400)
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key)return reply({ok:false,error:"Unavailable"},503)
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const hashed=createHash("sha256").update(invitation).digest("hex")
 const {data:g,error}=await db.from("contract_guarantors")
  .select("id,status,invitation_expires_at,email")
  .eq("invitation_token_hash",hashed).maybeSingle()
 if(error||!g||g.email.toLowerCase()!==email||!g.invitation_expires_at||
   Date.parse(g.invitation_expires_at)<Date.now()||g.status==="declined")
   return reply({ok:false,error:"Invitación no disponible o vencida"},404)
 // Only allows the client to request a Supabase email OTP for the invited
 // address; never authenticates or accepts a guarantor without that OTP.
 return reply({ok:true,action:"request_account_email_link"})
}
