import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase =
  createClient(
    supabaseUrl,
    serviceRoleKey
  )

function clean(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim()
}

function generateToken() {
  return randomBytes(32)
    .toString("hex")
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json()

    const leadId =
      clean(
        body?.lead_id
      )

    const role =
      clean(
        body?.role
      )

    if (
      !leadId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing lead_id",
        },
        {
          status: 400,
        }
      )
    }

    if (
      role !== "tenant" &&
      role !== "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid role",
        },
        {
          status: 400,
        }
      )
    }

    const {
      data:
        existingToken,
      error:
        existingError,
    } =
      await supabase
        .from(
          "lead_activation_tokens"
        )
        .select(
          "token, expires_at, revoked_at"
        )
        .eq(
          "lead_id",
          leadId
        )
        .eq(
          "role",
          role
        )
        .is(
          "revoked_at",
          null
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle()

    if (
      existingError
    ) {
      throw existingError
    }

    if (
      existingToken
    ) {
      const expired =
        existingToken
          .expires_at
          ? new Date(
              existingToken
                .expires_at
            ).getTime() <
            Date.now()
          : false

      if (
        !expired
      ) {
        return NextResponse.json({
          ok: true,

          token:
            existingToken
              .token,

          activation_url:
            `/activar/${existingToken.token}`,

          reused:
            true,
        })
      }
    }

    const token =
      generateToken()

    const expiresAt =
      new Date()

    expiresAt.setFullYear(
      expiresAt.getFullYear() +
        1
    )

    const {
      error:
        insertError,
    } =
      await supabase
        .from(
          "lead_activation_tokens"
        )
        .insert({
          lead_id:
            leadId,

          role,

          token,

          expires_at:
            expiresAt.toISOString(),
        })

    if (
      insertError
    ) {
      throw insertError
    }

    return NextResponse.json({
      ok: true,

      token,

      activation_url:
        `/activar/${token}`,

      reused:
        false,
    })
  } catch (
    error
  ) {
    console.error(
      "activation-token POST error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
          Error
            ? error.message
            : "Unexpected error",
      },
      {
        status: 500,
      }
    )
  }
}

export async function GET(
  request: Request
) {
  try {
    const {
      searchParams,
    } =
      new URL(
        request.url
      )

    const token =
      clean(
        searchParams.get(
          "token"
        )
      )

    if (
      !token
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing token",
        },
        {
          status: 400,
        }
      )
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "lead_activation_tokens"
        )
        .select(
          "lead_id, role, expires_at, revoked_at"
        )
        .eq(
          "token",
          token
        )
        .maybeSingle()

    if (
      error
    ) {
      throw error
    }

    if (
      !data
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      data.revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token revoked",
        },
        {
          status: 410,
        }
      )
    }

    if (
      data.expires_at &&
      new Date(
        data.expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token expired",
        },
        {
          status: 410,
        }
      )
    }

    await supabase
      .from(
        "lead_activation_tokens"
      )
      .update({
        last_used_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "token",
        token
      )

    return NextResponse.json({
      ok: true,

      lead_id:
        data.lead_id,

      role:
        data.role,
    })
  } catch (
    error
  ) {
    console.error(
      "activation-token GET error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof
          Error
            ? error.message
            : "Unexpected error",
      },
      {
        status: 500,
      }
    )
  }
}
