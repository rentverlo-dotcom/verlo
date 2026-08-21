import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
]

type MediaItem = {
  key: string
  publicUrl?: string | null
  filename?: string | null
  contentType?: string | null
  size?: number | null
  mediaType?: "photo" | "video"
}

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

    const tenantReadyWebhook =
      process.env
        .GHL_TENANT_MATCH_READY_WEBHOOK_URL

    const r2Bucket =
      process.env.R2_BUCKET || "verlo"

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

    const media =
      Array.isArray(body?.media)
        ? body.media
        : []

    if (!token) {
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

    if (
      media.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "At least one media item is required",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN DE CARGA DEL OWNER
    // =========================================================

    const {
      data: accessToken,
      error: tokenError,
    } = await supabase
      .from(
        "owner_property_access_tokens"
      )
      .select(`
        id,
        owner_lead_id,
        completion_id,
        expires_at,
        revoked_at
      `)
      .eq(
        "token",
        token
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
      accessToken.revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token revoked",
        },
        {
          status: 403,
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

    if (
      !accessToken.owner_lead_id ||
      !accessToken.completion_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property token incomplete",
        },
        {
          status: 409,
        }
      )
    }

    const ownerLeadId =
      accessToken.owner_lead_id

    const completionId =
      accessToken.completion_id

    // =========================================================
    // 2. MARCAR PROPIEDAD COMPLETA
    // =========================================================

    const {
      error: completionError,
    } = await supabase
      .from(
        "owner_property_completions"
      )
      .update({
        status: "submitted",
      })
      .eq(
        "id",
        completionId
      )
      .eq(
        "lead_id",
        ownerLeadId
      )

    if (
      completionError
    ) {
      console.error(
        "completion update:",
        completionError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not complete property",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 3. GUARDAR MEDIA SIN DUPLICAR
    // =========================================================

    const {
      data: existingMedia,
      error:
        existingMediaError,
    } = await supabase
      .from(
        "owner_property_media"
      )
      .select(
        "r2_key"
      )
      .eq(
        "completion_id",
        completionId
      )

    if (
      existingMediaError
    ) {
      throw new Error(
        existingMediaError.message
      )
    }

    const existingKeys =
      new Set(
        (
          existingMedia ||
          []
        ).map(
          (item) =>
            clean(
              item.r2_key
            )
        )
      )

    const cleanMedia =
      (
        media as MediaItem[]
      )
        .filter(
          (item) =>
            item?.key &&
            !existingKeys.has(
              clean(
                item.key
              )
            )
        )
        .map(
          (
            item,
            index
          ) => ({
            completion_id:
              completionId,

            lead_id:
              ownerLeadId,

            owner_prospect_id:
              null,

            match_id:
              null,

            media_type:
              item.mediaType ||
              (
                item.contentType
                  ?.startsWith(
                    "video/"
                  )
                  ? "video"
                  : "photo"
              ),

            r2_bucket:
              r2Bucket,

            r2_key:
              item.key,

            public_url:
              item.publicUrl ||
              null,

            original_filename:
              item.filename ||
              null,

            content_type:
              item.contentType ||
              null,

            size_bytes:
              item.size ||
              null,

            position:
              existingKeys.size +
              index,
          })
        )

    if (
      cleanMedia.length >
      0
    ) {
      const {
        error: mediaError,
      } = await supabase
        .from(
          "owner_property_media"
        )
        .insert(
          cleanMedia
        )

      if (
        mediaError
      ) {
        console.error(
          "media insert:",
          mediaError
        )

        return NextResponse.json(
          {
            ok: false,
            error:
              "Property completed but media metadata failed",
          },
          {
            status: 500,
          }
        )
      }
    }

    // =========================================================
    // 4. MATCHES DE ESTA PROPIEDAD
    // =========================================================

    const {
      data: matches,
      error: matchesError,
    } = await supabase
      .from(
        "lead_matches"
      )
      .select(`
        id,
        tenant_lead_id,
        owner_lead_id,
        score,
        status,
        reasons,
        owner_completed_at,
        notified_at
      `)
      .eq(
        "owner_lead_id",
        ownerLeadId
      )
      .gte(
        "score",
        80
      )
      .in(
        "status",
        ACTIVE_MATCH_STATUSES
      )
      .order(
        "score",
        {
          ascending: false,
        }
      )

    if (
      matchesError
    ) {
      throw new Error(
        matchesError.message
      )
    }

    if (
      !matches ||
      matches.length === 0
    ) {
      await supabase
        .from(
          "owner_property_access_tokens"
        )
        .update({
          revoked_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          accessToken.id
        )

      return NextResponse.json({
        ok: true,

        owner_lead_id:
          ownerLeadId,

        completion_id:
          completionId,

        media_count:
          cleanMedia.length,

        matches_found: 0,

        tenants_notified:
          0,
      })
    }

    // =========================================================
    // 5. MARCAR OWNER COMPLETO EN TODOS SUS MATCHES
    // =========================================================

    const now =
      new Date()
        .toISOString()

    const matchIds =
      matches.map(
        (match) =>
          match.id
      )

    const {
      error:
        ownerCompletedError,
    } = await supabase
      .from(
        "lead_matches"
      )
      .update({
        owner_completed_at:
          now,
      })
      .in(
        "id",
        matchIds
      )

    if (
      ownerCompletedError
    ) {
      throw new Error(
        ownerCompletedError
          .message
      )
    }

    // =========================================================
    // 6. AGRUPAR POR TENANT
    //
    // UN TENANT PUEDE TENER MUCHAS PROPIEDADES.
    // NO GENERAMOS UN TOKEN POR MATCH.
    // =========================================================

    const tenantLeadIds =
      Array.from(
        new Set(
          matches.map(
            (match) =>
              match
                .tenant_lead_id
          )
        )
      )

    const {
      data: tenants,
      error: tenantsError,
    } = await supabase
      .from(
        "lead_intake"
      )
      .select(`
        id,
        full_name,
        phone,
        phone_normalized,
        email
      `)
      .in(
        "id",
        tenantLeadIds
      )

    if (
      tenantsError
    ) {
      throw new Error(
        tenantsError.message
      )
    }

    const tenantsById =
      new Map(
        (
          tenants ||
          []
        ).map(
          (tenant) => [
            tenant.id,
            tenant,
          ]
        )
      )

    const notificationResults:
      Array<{
        tenant_lead_id:
          string

        matches_url:
          string

        match_count:
          number

        sent:
          boolean
      }> = []

    // =========================================================
    // 7. UN TOKEN AGREGADO POR TENANT
    // =========================================================

    for (
      const tenantLeadId
      of tenantLeadIds
    ) {
      const tenant =
        tenantsById.get(
          tenantLeadId
        )

      if (!tenant) {
        continue
      }

      // =======================================================
      // MATCHES ACTUALMENTE VISIBLES PARA ESTE TENANT
      // =======================================================

      const {
        data:
          tenantReadyMatches,
        error:
          tenantReadyError,
      } = await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          score,
          notified_at
        `)
        .eq(
          "tenant_lead_id",
          tenantLeadId
        )
        .gte(
          "score",
          80
        )
        .in(
          "status",
          ACTIVE_MATCH_STATUSES
        )
        .not(
          "owner_completed_at",
          "is",
          null
        )
        .order(
          "score",
          {
            ascending: false,
          }
        )

      if (
        tenantReadyError
      ) {
        throw new Error(
          tenantReadyError
            .message
        )
      }

      if (
        !tenantReadyMatches ||
        tenantReadyMatches.length ===
          0
      ) {
        continue
      }

      // =======================================================
      // SI NO HAY MATCH NUEVO SIN NOTIFICAR,
      // NO VOLVEMOS A MANDAR EL MISMO WHATSAPP
      // =======================================================

      const unnotifiedMatches =
        tenantReadyMatches.filter(
          (match) =>
            !match.notified_at
        )

      if (
        unnotifiedMatches.length ===
        0
      ) {
        continue
      }

      // =======================================================
      // BUSCAR TOKEN AGREGADO ACTIVO
      // =======================================================

      const {
        data:
          existingToken,
        error:
          tokenLookupError,
      } = await supabase
        .from(
          "tenant_matches_access_tokens"
        )
        .select(`
          id,
          token,
          expires_at
        `)
        .eq(
          "tenant_lead_id",
          tenantLeadId
        )
        .is(
          "revoked_at",
          null
        )
        .or(
          `expires_at.is.null,expires_at.gt.${now}`
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

      if (
        tokenLookupError
      ) {
        throw new Error(
          tokenLookupError
            .message
        )
      }

      let tenantToken:
        string

      if (
        existingToken
      ) {
        tenantToken =
          existingToken.token
      } else {
        tenantToken =
          randomBytes(32)
            .toString(
              "hex"
            )

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
            tokenInsertError,
        } = await supabase
          .from(
            "tenant_matches_access_tokens"
          )
          .insert({
            tenant_lead_id:
              tenantLeadId,

            token:
              tenantToken,

            expires_at:
              expiresAt,
          })

        if (
          tokenInsertError
        ) {
          throw new Error(
            tokenInsertError
              .message
          )
        }
      }

      const matchesUrl =
        `https://verlo.lat/matches/${tenantToken}`

      let sent =
        false

      // =======================================================
      // 8. UN SOLO WEBHOOK PARA EL TENANT
      // =======================================================

      if (
        tenantReadyWebhook
      ) {
        try {
          const response =
            await fetch(
              tenantReadyWebhook,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    lead_id:
                      tenant.id,

                    full_name:
                      tenant.full_name,

                    first_name:
                      clean(
                        tenant
                          .full_name
                      ).split(
                        /\s+/
                      )[0] ||
                      "",

                    phone:
                      normalizePhone(
                        tenant
                          .phone_normalized ||
                          tenant.phone
                      ),

                    email:
                      clean(
                        tenant.email
                      ).toLowerCase(),

                    role:
                      "tenant",

                    verlo_matches_token:
                      tenantToken,

                    verlo_matches_url:
                      matchesUrl,

                    verlo_match_count:
                      tenantReadyMatches.length,

                    verlo_new_match_count:
                      unnotifiedMatches.length,

                    verlo_best_match_score:
                      Number(
                        tenantReadyMatches[
                          0
                        ]?.score ||
                          0
                      ),

                    source:
                      "verlo_matches_ready",

                    tags: [
                      "verlo_lead",
                      "verlo_tenant",
                      "verlo_matches_ready",
                    ],
                  }),
              }
            )

          sent =
            response.ok

          if (
            !response.ok
          ) {
            console.error(
              "GHL tenant matches notify failed",
              tenantLeadId,
              response.status
            )
          }
        } catch (
          webhookError
        ) {
          console.error(
            "GHL tenant matches webhook error",
            tenantLeadId,
            webhookError
          )
        }
      }

      // =======================================================
      // 9. SOLO SI GHL RECIBIÓ EL EVENTO
      // MARCAMOS ESOS MATCHES COMO NOTIFICADOS
      // =======================================================

      if (sent) {
        const ids =
          unnotifiedMatches.map(
            (match) =>
              match.id
          )

        const {
          error:
            notifiedError,
        } = await supabase
          .from(
            "lead_matches"
          )
          .update({
            notified_at:
              new Date()
                .toISOString(),
          })
          .in(
            "id",
            ids
          )

        if (
          notifiedError
        ) {
          console.error(
            "Could not mark matches notified:",
            notifiedError
          )
        }
      }

      notificationResults.push({
        tenant_lead_id:
          tenantLeadId,

        matches_url:
          matchesUrl,

        match_count:
          tenantReadyMatches.length,

        sent,
      })
    }

    // =========================================================
    // 10. CERRAR TOKEN DE CARGA DEL OWNER
    // =========================================================

    await supabase
      .from(
        "owner_property_access_tokens"
      )
      .update({
        revoked_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        accessToken.id
      )

    // =========================================================
    // 11. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      owner_lead_id:
        ownerLeadId,

      completion_id:
        completionId,

      media_count:
        cleanMedia.length,

      matches_found:
        matches.length,

      tenants_ready:
        tenantLeadIds.length,

      tenants_notified:
        notificationResults.filter(
          (result) =>
            result.sent
        ).length,

      notifications:
        notificationResults,
    })
  } catch (error) {
    console.error(
      "owner completion error:",
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
