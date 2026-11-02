import {NextRequest,NextResponse} from "next/server"
import {supabaseAdmin} from "@/lib/supabase/admin"
import {createClient} from "@supabase/supabase-js"
export const runtime="nodejs"
export async function GET(req:NextRequest){
 const key=(req.headers.get("authorization")||"").replace("Bearer ","")
 if(!key)return NextResponse.json({error:"Unauthorized"},{status:401})
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 if(!url||!anon)return NextResponse.json({error:"Unavailable"},{status:503})
 const client=createClient(url,anon)
 const {data:auth,error}=await client.auth.getUser(key)
 if(error||!auth.user?.email_confirmed_at||!auth.user.email)return NextResponse.json({error:"Unauthorized"},{status:401})
 const {data:owners,error:ownerError}=await supabaseAdmin.from("lead_intake").select("id").in("role",["owner","both"]).ilike("email",auth.user.email).limit(100)
 if(ownerError)return NextResponse.json({error:"Unavailable"},{status:503})
 if(!owners?.length)return NextResponse.json({ok:true,operations:[]})
 const {data:contracts,error:contractError}=await supabaseAdmin.from("lead_contracts").select("id,tenant_lead_id").in("owner_lead_id",owners.map(x=>x.id)).limit(100)
 if(contractError)return NextResponse.json({error:"Unavailable"},{status:503})
 if(!contracts?.length)return NextResponse.json({ok:true,operations:[]})
 const {data:reviews,error:reviewError}=await supabaseAdmin.from("caucion_contract_reviews").select("application_id,lead_contract_id,status").in("lead_contract_id",contracts.map(x=>x.id))
 if(reviewError)return NextResponse.json({error:"Unavailable"},{status:503})
 if(!reviews?.length)return NextResponse.json({ok:true,operations:[]})
 const {data:applications,error:applicationError}=await supabaseAdmin.from("caucion_applications").select("id,tenant_lead_id,status").in("id",reviews.map(x=>x.application_id))
 if(applicationError)return NextResponse.json({error:"Unavailable"},{status:503})
 const operations=reviews.filter(r=>contracts.some(c=>c.id===r.lead_contract_id&&applications?.some(a=>a.id===r.application_id&&a.tenant_lead_id===c.tenant_lead_id))).map(r=>({contract_id:r.lead_contract_id,review_status:r.status,caucion_status:applications?.find(a=>a.id===r.application_id)?.status}))
 return NextResponse.json({ok:true,operations},{headers:{"Cache-Control":"no-store"}})
}
