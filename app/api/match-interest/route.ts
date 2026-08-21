import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function clean(value: unknown) {
  return String(value || "").trim()
}

function normalizePhone(value: unknown) {
  return clean(value).replace(/\D/g, "")
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    const ownerInterestWebhook =
      process.env
        .GHL_OWNER_MATCH_INTEREST_WEBHOOK_URL

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing Supabase env vars",
        },
        {
          status: 500,
        }
      )
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )

    const body =
      await request
        .json()
        .catch(() => ({}))

    const token =
      clean(body?.token)

    const action =
      clean(body?.action)

    if (
      !token ||
      action !==
        "tenant_interest"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid request",
        },
        {
          status: 400,
        }
      )
    }

    // TOKEN TENANT

    const {
      data: accessToken,
      error: tokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
          id,
          match_id,
          lead_id,
          expires_at
        `)
        .eq(
          "token",
          token
        )
        .eq(
          "audience",
          "tenant"
        )
        .single()

    if (
      tokenError ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken.expires_at &&
      new Date(
        accessToken.expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Expired token",
        },
        {
          status: 403,
        }
      )
    }

    // MATCH

    const {
      data: match,
      error: matchError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          score,
          tenant_interest_at,
          owner_interest_at,
          ready_to_connect_at
        `)
        .eq(
          "id",
          accessToken.match_id
        )
        .single()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      match.tenant_lead_id !==
      accessToken.lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unauthorized token",
        },
        {
          status: 403,
        }
      )
    }

    const now =
      new Date()
        .toISOString()

    // REGISTRAR OK TENANT

    if (
      !match.tenant_interest_at
    ) {
      const {
        error:
          interestUpdateError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            tenant_interest_at:
              now,
          })
          .eq(
            "id",
            match.id
          )

      if (
        interestUpdateError
      ) {
        throw new Error(
          interestUpdateError.message
        )
      }
    }

    // TOKEN OWNER PARA ESTE MATCH

    let ownerToken:
      string | null = null

    const {
      data:
        existingOwnerToken,
      error:
        ownerTokenError,
    } =
      await supabase
        .from(
          "match_access_tokens"
        )
        .select(`
          token,
          expires_at
        `)
        .eq(
          "match_id",
          match.id
        )
        .eq(
          "lead_id",
          match.owner_lead_id
        )
        .eq(
          "audience",
          "owner"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

    if (ownerTokenError) {
      throw new Error(
        ownerTokenError.message
      )
    }

    const validOwnerToken =
      existingOwnerToken &&
      (
        !existingOwnerToken
          .expires_at ||
        new Date(
          existingOwnerToken
            .expires_at
        ).getTime() >
          Date.now()
      )

    if (validOwnerToken) {
      ownerToken =
        existingOwnerToken.token
    } else {
      ownerToken =
        randomBytes(32)
          .toString("hex")

      const expiresAt =
        new Date(
          Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000
        ).toISOString()

      const {
        error:
          insertTokenError,
      } =
        await supabase
          .from(
            "match_access_tokens"
          )
          .insert({
            match_id:
              match.id,

            lead_id:
              match.owner_lead_id,

            token:
              ownerToken,

            audience:
              "owner",

            expires_at:
              expiresAt,
          })

      if (
        insertTokenError
      ) {
        throw new Error(
          insertTokenError.message
        )
      }
    }

    const ownerDecisionUrl =
      `https://verlo.lat/candidato/${ownerToken}`

    // OWNER

    const {
      data: owner,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          full_name,
          phone,
          phone_normalized,
          email
        `)
        .eq(
          "id",
          match.owner_lead_id
        )
        .single()

    // TENANT

    const {
      data: tenant,
    } =
      await supabase
        .from("lead_intake")
        .select(`
          id,
          full_name,
          budget_max,
          move_timing,
          income_proof_type,
          income_range,
          income_max,
          guarantee_types
        `)
        .eq(
          "id",
          match.tenant_lead_id
        )
        .single()

    // AVISO OWNER

    let ownerNotified =
      false

    if (
      ownerInterestWebhook &&
      owner
    ) {
      const response =
        await fetch(
          ownerInterestWebhook,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                lead_id:
                  owner.id,

                full_name:
                  owner.full_name,

                first_name:
                  clean(
                    owner.full_name
                  ).split(
                    /\s+/
                  )[0] || "",

                phone:
                  normalizePhone(
                    owner
                      .phone_normalized ||
                      owner.phone
                  ),

                email:
                  clean(
                    owner.email
                  ).toLowerCase(),

                match_id:
                  match.id,

                tenant_name:
                  tenant?.full_name,

                tenant_budget:
                  tenant?.budget_max,

                tenant_move_timing:
                  tenant?.move_timing,

                tenant_income_proof:
                  tenant
                    ?.income_proof_type,

                tenant_income_range:
                  tenant
                    ?.income_range,

                tenant_income_max:
                  tenant
                    ?.income_max,

                tenant_guarantees:
                  tenant
                    ?.guarantee_types,

                verlo_match_score:
                  Number(
                    match.score || 0
                  ),

                verlo_owner_decision_url:
                  ownerDecisionUrl,

                source:
                  "verlo_tenant_interest",
              }),
          }
        )

      ownerNotified =
        response.ok
    }

    return NextResponse.json({
      ok: true,

      match_id:
        match.id,

      tenant_interest:
        true,

      owner_notified:
        ownerNotified,

      owner_decision_url:
        ownerDecisionUrl,
    })
  } catch (error) {
    console.error(
      "match-interest error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
