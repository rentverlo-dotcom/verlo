import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const answer = (status: number, data: object) => NextResponse.json(data, {
    status, headers: { "Cache-Control": "no-store" },
  })
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "feature/temporarios")
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
  const [properties,demands] = await Promise.all([
    db.from("temporary_properties")
      .select("id,locality_label,property_type,nightly_price_ars,availability_start,availability_end,status,created_at")
      .eq("owner_user_id",user.id).order("created_at",{ascending:false}).limit(50),
    db.from("temporary_demands")
      .select("id,locality_keys,property_type,check_in,check_out,max_total_budget_ars,status,created_at")
      .eq("tenant_user_id",user.id).order("created_at",{ascending:false}).limit(50),
  ])
  if (properties.error || demands.error)
    return answer(503,{ok:false,error:"No pudimos consultar tus temporarios"})
  return answer(200,{ok:true,properties:properties.data||[],demands:demands.data||[]})
}
