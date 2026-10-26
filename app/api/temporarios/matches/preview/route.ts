import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authorizeTemporaryWrite } from "@/lib/temporarios/write-auth"
import { evaluateTemporaryMatch, type TemporaryPropertyType } from "@/lib/temporarios/matching"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const reply = (status: number, data: object) => NextResponse.json(data, {
  status, headers: { "Cache-Control": "no-store" },
})

// A read-only preview: no inserts, notifications, fee or date blocking.
// Restricted to the authorized QA identity on the isolated preview branch.
export async function GET(request: Request) {
  const auth = await authorizeTemporaryWrite(request, "tenant")
  if ("status" in auth) return reply(auth.status, { ok: false, error: auth.error })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return reply(503, { ok: false, error: "Servicio no configurado" })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const [p,d,b] = await Promise.all([
    db.from("temporary_properties").select("id,owner_user_id,locality_key,property_type,nightly_price_ars,availability_start,availability_end,max_guests,status").eq("status","published").limit(200),
    db.from("temporary_demands").select("id,tenant_user_id,locality_keys,property_type,check_in,check_out,max_total_budget_ars,guests,status").eq("status","active").limit(200),
    db.from("temporary_availability_blocks").select("property_id,check_in,check_out").limit(1000),
  ])
  if (p.error || d.error || b.error) return reply(503, { ok:false, error:"No se pudo consultar Temporarios" })

  const blocksByProperty = new Map<string, Array<{ checkIn: string; checkOut: string }>>()
  for (const block of b.data || []) {
    const list = blocksByProperty.get(block.property_id) || []
    list.push({checkIn:block.check_in,checkOut:block.check_out})
    blocksByProperty.set(block.property_id,list)
  }
  const matches: Array<{propertyId:string;demandId:string;nights:number;totalPriceArs:number}> = []
  for (const demand of d.data || []) for (const property of p.data || []) {
    const decision = evaluateTemporaryMatch({
      localityKeys:demand.locality_keys,
      propertyType:demand.property_type as TemporaryPropertyType,
      checkIn:demand.check_in,
      checkOut:demand.check_out,
      maxTotalBudgetArs:Number(demand.max_total_budget_ars),
      guests:demand.guests,
    },{
      localityKey:property.locality_key,
      propertyType:property.property_type as TemporaryPropertyType,
      nightlyPriceArs:Number(property.nightly_price_ars),
      availabilityStart:property.availability_start,
      availabilityEnd:property.availability_end,
      maxGuests:property.max_guests,
      status:"published",
    },blocksByProperty.get(property.id)||[])
    if (decision.compatible) matches.push({
      propertyId:property.id,demandId:demand.id,
      nights:decision.nights,totalPriceArs:decision.totalPriceArs,
    })
  }
  return reply(200,{ok:true,mode:"read_only",propertyCount:p.data?.length||0,
    demandCount:d.data?.length||0,blockedIntervals:b.data?.length||0,
    candidateCount:matches.length,candidates:matches.slice(0,100),
    truncated:(p.data?.length||0)===200||(d.data?.length||0)===200||(b.data?.length||0)===1000})
}
