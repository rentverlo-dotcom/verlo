import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const answer = (status: number, data: object) => NextResponse.json(data, {
    status, headers: { "Cache-Control": "no-store" },
  })
  const isPreview = process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/temporarios"
  const isProduction = process.env.VERCEL_ENV === "production" &&
    process.env.TEMPORARY_PUBLIC_ENABLED === "true"
  if (!isPreview && !isProduction)
    return answer(404, {ok:false,error:"Not available"})
  const bearer = request.headers.get("authorization") || ""
  if (!bearer.startsWith("Bearer ") || bearer.length > 4096)
    return answer(401, {ok:false,error:"Login required"})

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) return answer(503, {ok:false,error:"Unavailable"})

  const authClient = createClient(url, anon, {auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:authError} = await authClient.auth.getUser(bearer.slice(7))
  if (authError || !user?.id || !user.email_confirmed_at)
    return answer(401, {ok:false,error:"Verified login required"})

  const db = createClient(url, service, {auth:{persistSession:false,autoRefreshToken:false}})
  const [properties,demands,ownerMatches,tenantMatches] = await Promise.all([
    db.from("temporary_properties")
      .select("id,locality_label,property_type,nightly_price_ars,availability_start,availability_end,status,created_at")
      .eq("owner_user_id",user.id).order("created_at",{ascending:false}).limit(50),
    db.from("temporary_demands")
      .select("id,locality_keys,property_type,check_in,check_out,max_total_budget_ars,status,created_at")
      .eq("tenant_user_id",user.id).order("created_at",{ascending:false}).limit(50),
    db.from("temporary_matches").select("id,property_id,demand_id,check_in,check_out,agreed_total_ars,status,owner_decision,tenant_decision,created_at,temporary_properties!inner(owner_user_id,locality_label,property_type,nightly_price_ars,title,description,public_location_reference,max_guests)").eq("temporary_properties.owner_user_id",user.id).order("created_at",{ascending:false}).limit(50),
    db.from("temporary_matches").select("id,property_id,demand_id,check_in,check_out,agreed_total_ars,status,owner_decision,tenant_decision,created_at,temporary_demands!inner(tenant_user_id),temporary_properties(locality_label,property_type,nightly_price_ars,title,description,public_location_reference,max_guests)").eq("temporary_demands.tenant_user_id",user.id).order("created_at",{ascending:false}).limit(50),
  ])
  if (properties.error || demands.error || ownerMatches.error || tenantMatches.error)
    return answer(503,{ok:false,error:"No pudimos consultar tus temporarios"})
  const ids = Array.from(new Set([
    ...(properties.data||[]).map(p=>p.id),
    ...(tenantMatches.data||[]).map(m=>m.property_id),
  ]))
  let media: Array<{id:string;property_id:string;mime_type:string}> = []
  if(ids.length){
    const listing=await db.from("temporary_property_media").select("id,property_id,mime_type").in("property_id",ids).order("created_at",{ascending:true}).limit(600)
    if(listing.error)return answer(503,{ok:false,error:"No pudimos consultar las fotografías"})
    media=listing.data||[]
  }
  const matchIds=Array.from(new Set([...(ownerMatches.data||[]),...(tenantMatches.data||[])].map(m=>m.id)))
  let reservations:Array<{id:string;match_id:string;status:string;agreed_terms_owner_at:string|null;agreed_terms_tenant_at:string|null;confirmed_by_owner_at:string|null;confirmed_by_tenant_at:string|null}>=[]
  if(matchIds.length){
    const rows=await db.from("temporary_reservations").select("id,match_id,status,agreed_terms_owner_at,agreed_terms_tenant_at,confirmed_by_owner_at,confirmed_by_tenant_at").in("match_id",matchIds).limit(100)
    if(rows.error)return answer(503,{ok:false,error:"No pudimos consultar las reservas"})
    reservations=rows.data||[]
  }
  return answer(200,{ok:true,reservations,media,properties:properties.data||[],demands:demands.data||[],ownerMatches:ownerMatches.data||[],tenantMatches:tenantMatches.data||[]})
}
