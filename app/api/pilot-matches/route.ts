import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PILOT_IDS = new Set([
  // TENANTS
  "1c60d7f5-0dd6-4b93-a3b5-3ce2d06d5b35", // Mara
  "9f602d5e-60c1-4303-a04c-21c5a234c60c", // Monica
  "c5e78e14-7a5f-4a73-959b-3ce17bae4ffc", // Fabiana
  "355dede6-97a4-4d2f-9a71-5b79665a1fb3", // Martina
  "d8ad4af6-126c-41fe-9f92-73cdec28304a", // Mayra
  "d299962d-4a88-46b1-b5bd-777a497608cc", // Silvia
  "3270c673-a694-49d3-8016-7a005c7e0e31", // Griselda
  "86a9e3b3-35b9-4fc5-9087-743d9f32dac2", // Rosselyne

  // OWNERS
  "8b2d646d-2c5c-4056-8a5a-1943cf3e53f2", // Paola
  "80b1e2b0-1c50-4481-bd8e-ea5f1005d8d7", // Melgarejo
  "e1e1565b-f6d9-454c-af9c-fdcca534ee9f", // Karina
  "f7129b4e-358a-4ff1-9743-dc14d93af4cf", // Romina
  "4cdfc0be-d8a3-4634-9612-092fe212c40a", // Nira
])

function money(value: unknown) {
  const n = Number(value || 0)
  if (!n) return ""
  return `$ ${n.toLocaleString("es-AR")}`
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const ghlWebhookUrl =
  "https://services.leadconnectorhq.com/hooks/cvNj4z9CkErHpF9tD4BE/webhook-trigger/295302fb-a1ee-459e-a075-ec639b80177d"

    if (!supabaseUrl || !serviceRoleKey || !ghlWebhookUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o GHL_LEAD_WEBHOOK_URL",
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 1. Traemos los leads concretos del piloto
    const { data: leads, error: leadsError } = await supabase
      .from("lead_intake")
      .select("*")
      .in("id", Array.from(PILOT_IDS))

    if (leadsError) {
      throw new Error(leadsError.message)
    }

    // 2. Traemos los matches actuales desde la vista que ya estamos usando
    const { data: matches, error: matchesError } = await supabase
      .from("actionable_matches")
      .select("*")
      .gte("match_score", 70)

    if (matchesError) {
      throw new Error(matchesError.message)
    }

    const results = []

    for (const lead of leads || []) {
      const role =
        lead.intent === "owner_new_listing"
          ? "owner"
          : lead.intent === "tenant_search"
            ? "tenant"
            : lead.role

      if (role !== "owner" && role !== "tenant") continue

      // Todos los matches correspondientes a ESTE lead
      const leadMatches = (matches || []).filter((m: any) =>
        role === "tenant"
          ? m.tenant_id === lead.id
          : m.owner_id === lead.id
      )

      if (leadMatches.length === 0) continue

      const matches100 = leadMatches.filter(
        (m: any) => Number(m.match_score) === 100
      )

      const matches70 = leadMatches.filter(
        (m: any) => Number(m.match_score) === 70
      )

      // Ordenamos para elegir el mejor
      const ordered = [...leadMatches].sort(
        (a: any, b: any) =>
          Number(b.match_score || 0) - Number(a.match_score || 0)
      )

      const best = ordered[0]

      const tags = [
        "verlo_lead",
        role === "owner" ? "verlo_owner" : "verlo_tenant",
        role === "owner"
          ? "verlo_owner_new_listing"
          : "verlo_tenant_search",

        // ESTE ES EL QUE DISPARA TU WF
        "verlo_pilot_match",
      ]

      const payload = {
        lead_id: lead.id,

        full_name: lead.full_name,
        first_name: String(lead.full_name || "").split(" ")[0],
        email: lead.email,
        phone: lead.phone,
        role,
        intent: lead.intent,

        tags,

        // CUSTOM FIELDS DEL MAIL
        verlo_match_count: leadMatches.length,
        verlo_match_100_count: matches100.length,
        verlo_match_70_count: matches70.length,
        verlo_best_match_score: Number(best?.match_score || 0),

        verlo_best_zone:
          Array.isArray(best?.owner_neighborhood)
            ? best.owner_neighborhood[0] || ""
            : best?.owner_neighborhood || "",

        verlo_best_timing:
          role === "tenant"
            ? best?.move_timing || ""
            : best?.availability_status || "",

        verlo_best_property_type: best?.property_type || "",
        verlo_best_rooms: best?.property_rooms || "",
        verlo_best_price: money(best?.approx_price_number),

        verlo_best_matches_on:
          "zona, momento, tipo de propiedad, ambientes y presupuesto",

        verlo_match_summary: `${matches100.length} matches al 100% y ${matches70.length} matches al 70%`,

        verlo_match_role: role,
        verlo_match_updated_at: new Date().toISOString(),

        source: "verlo_pilot_match",
      }

      const response = await fetch(ghlWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text().catch(() => "")

      results.push({
        lead_id: lead.id,
        name: lead.full_name,
        role,
        matches: leadMatches.length,
        matches_100: matches100.length,
        sent: response.ok,
        ghl_status: response.status,
        ghl_response: responseText,
      })
    }

    return NextResponse.json({
      ok: true,
      pilot_requested: PILOT_IDS.size,
      leads_found: leads?.length || 0,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("pilot matches error:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error procesando piloto",
      },
      { status: 500 }
    )
  }
}
