import { NextRequest,NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyCaucionLead } from "@/lib/powermarket/lead-token"
export const runtime="nodejs"
export const dynamic="force-dynamic"
export async function POST(req:NextRequest){
 try{
  const body=await req.json().catch(()=>null)
  const leadId=verifyCaucionLead(String(body?.access||""))
  if(!leadId)return NextResponse.json({error:"Enlace inválido o vencido"},{status:401})
  const rent=Number(body?.rent), expenses=Number(body?.expenses),income=Number(body?.income),months=Number(body?.months),coIncome=body?.coIncome==null||body?.coIncome===""?null:Number(body.coIncome)
  const employment=String(body?.employment||"")
  const hasCo=body?.hasCo===true
  if(![rent,expenses,income,months].every(Number.isFinite)||rent<=0||expenses<0||income<0||!Number.isInteger(months)||months<1||months>120||!["salary_receipt","monotributo","self_employed","other_formal","none"].includes(employment)||hasCo&&(!Number.isFinite(coIncome)||coIncome<0)||coIncome!==null&&(!Number.isFinite(coIncome)||coIncome<0)||body?.consent!==true)
   return NextResponse.json({error:"Completá todos los datos y autorizá el tratamiento de la solicitud"},{status:400})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!key)throw new Error("Supabase missing")
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:lead,error:leadError}=await db.from("lead_intake").select("id,role,intent").eq("id",leadId).single()
  if(leadError||lead?.role!=="tenant"||lead?.intent!=="tenant_search")return NextResponse.json({error:"Solicitud no autorizada"},{status:403})
  const {data:existing,error:lookupError}=await db.from("caucion_applications").select("id").eq("tenant_lead_id",leadId).limit(1)
  if(lookupError)throw lookupError
  if(existing?.length)return NextResponse.json({ok:true,already_submitted:true})
  const {data,error}=await db.from("caucion_applications").insert({
   tenant_lead_id:leadId,requested_rent_ars:rent,estimated_expenses_ars:expenses,duration_months:months,monthly_income_ars:income,
   employment_type:employment,has_co_tenant:hasCo,co_tenant_income_ars:hasCo?coIncome:null,
   status:"submitted",submitted_at:new Date().toISOString(),consent_at:new Date().toISOString(),consent_version:"powermarket-v1"
  }).select("id").single()
  if(error)throw error
  const {error:eventError}=await db.from("caucion_events").insert({application_id:data.id,event_key:`caucion:submitted:${data.id}`,event_type:"application_submitted",payload:{source:"verlo_tenant_optin"}})
  if(eventError)console.error("PowerMarket event logging failed",eventError)
  return NextResponse.json({ok:true,application_id:data.id})
 }catch(e){console.error("PowerMarket application create failed",e);return NextResponse.json({error:"No pudimos guardar la solicitud"},{status:500})}
}
