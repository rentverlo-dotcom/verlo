import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars")
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      token,
      document_number,
      employment_status,
      income_range,
      guarantee_type,
      move_notes,
      documents = {},
    } = body || {}

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const { data: accessToken, error: tokenError } = await supabase
      .from("match_access_tokens")
      .select("id, match_id, lead_id, audience, expires_at")
      .eq("token", token)
      .eq("audience", "tenant")
      .single()

    if (tokenError || !accessToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    if (
      accessToken.expires_at &&
      new Date(accessToken.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "Expired token" }, { status: 403 })
    }

    const { data: verification, error: verificationError } = await supabase
      .from("tenant_verifications")
      .insert({
        lead_id: accessToken.lead_id,
        match_id: accessToken.match_id,

        dni_front_path: documents.dni_front || null,
        dni_back_path: documents.dni_back || null,
        selfie_path: documents.selfie || null,
        income_proof_path: documents.income_proof || null,

        document_number: document_number || null,
        employment_status: employment_status || null,
        income_range: income_range || null,
        guarantee_type: guarantee_type || null,
        move_notes:
          [
            documents.guarantee_proof
              ? `Garantía / seguro / caución path: ${documents.guarantee_proof}`
              : "",
            move_notes || "",
          ]
            .filter(Boolean)
            .join("\n\n") || null,

        status: "submitted",
      })
      .select("id")
      .single()

    if (verificationError || !verification) {
      console.error("tenant verification insert error:", verificationError)
      return NextResponse.json(
        { error: "Could not save tenant verification" },
        { status: 500 }
      )
    }

    if (accessToken.match_id) {
      await supabase
        .from("lead_matches")
        .update({
          tenant_verified_at: new Date().toISOString(),
        })
        .eq("id", accessToken.match_id)
    }

    await supabase
      .from("match_access_tokens")
      .update({
        used_at: new Date().toISOString(),
      })
      .eq("id", accessToken.id)

    return NextResponse.json({
      ok: true,
      verification_id: verification.id,
    })
  } catch (error) {
    console.error("tenant verification error:", error)

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    )
  }
}
