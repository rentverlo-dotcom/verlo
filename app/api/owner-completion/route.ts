import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import {
  notifyLeadOnce,
} from "@/lib/lead-notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ACTIVE_MATCH_STATUSES = [
  "new",
  "reviewed",
  "contacted",
  "converted",
]

const MIN_MATCH_SCORE = 80

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

async function postInternal(
  request: Request,
  path: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    new URL(path, request.url),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(body),

      cache:
        "no-store",
    }
  )

  const data =
    await response
      .json()
      .catch(
        () => null
      )

  return {
    ok:
      response.ok &&
      data?.ok !== false,

    status:
      response.status,

    data,
  }
}

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    const r2Bucket =
      process.env.R2_BUCKET ||
      "verlo"

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
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    const media =
      Array.isArray(
        body?.media
      )
        ? body.media
        : []

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

    // =========================================================
    // 1. VALIDAR TOKEN DEL OWNER
    // =========================================================

    const {
      data:
        accessToken,

      error:
        tokenError,
    } =
      await supabase
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
      accessToken
        .revoked_at
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
      accessToken
        .expires_at &&
      new Date(
        accessToken
          .expires_at
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
      !accessToken
        .owner_lead_id ||
      !accessToken
        .completion_id
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
      accessToken
        .owner_lead_id

    const completionId =
      accessToken
        .completion_id

    // =========================================================
    // 2. LEER ESTADO REAL DE LA PROPIEDAD
    // =========================================================

    const {
      data:
        completion,

      error:
        completionFetchError,
    } =
      await supabase
        .from(
          "owner_property_completions"
        )
        .select(`
          id,
          lead_id,
          status
        `)
        .eq(
          "id",
          completionId
        )
        .eq(
          "lead_id",
          ownerLeadId
        )
        .single()

    if (
      completionFetchError ||
      !completion
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property completion not found",
        },
        {
          status: 404,
        }
      )
    }

    // =========================================================
    // 3. MULTIMEDIA YA GUARDADA
    // =========================================================

    const {
      data:
        existingMedia,

      error:
        existingMediaError,
    } =
      await supabase
        .from(
          "owner_property_media"
        )
        .select(`
          id,
          r2_key,
          media_type
        `)
        .eq(
          "lead_id",
          ownerLeadId
        )

    if (
      existingMediaError
    ) {
      throw new Error(
        existingMediaError
          .message
      )
    }

    const existingKeys =
      new Set(
        (
          existingMedia ||
          []
        )
          .map(
            (
              item
            ) =>
              clean(
                item.r2_key
              )
          )
          .filter(
            Boolean
          )
      )

    // =========================================================
    // 4. PREPARAR MEDIA NUEVA SIN DUPLICAR
    // =========================================================

    const cleanMedia =
      (
        media as
          MediaItem[]
      )
        .filter(
          (
            item
          ) => {
            const key =
              clean(
                item?.key
              )

            return (
              Boolean(
                key
              ) &&
              !existingKeys.has(
                key
              )
            )
          }
        )
        .map(
          (
            item,
            index
          ) => {
            const contentType =
              clean(
                item
                  .contentType
              )

            const mediaType =
              item.mediaType ===
              "video"
                ? "video"
                : item.mediaType ===
                  "photo"
                  ? "photo"
                  : contentType
                      .startsWith(
                        "video/"
                      )
                    ? "video"
                    : "photo"

            return {
              completion_id:
                completionId,

              lead_id:
                ownerLeadId,

              owner_prospect_id:
                null,

              match_id:
                null,

              media_type:
                mediaType,

              r2_bucket:
                r2Bucket,

              r2_key:
                clean(
                  item.key
                ),

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
                existingKeys
                  .size +
                index,
            }
          }
        )

    // =========================================================
    // 5. GUARDAR MEDIA NUEVA
    // =========================================================

    if (
      cleanMedia.length >
      0
    ) {
      const {
        error:
          mediaInsertError,
      } =
        await supabase
          .from(
            "owner_property_media"
          )
          .insert(
            cleanMedia
          )

      if (
        mediaInsertError
      ) {
        throw new Error(
          mediaInsertError
            .message
        )
      }
    }

    // =========================================================
    // 6. VALIDAR REQUISITO DE NEGOCIO:
    //    DEBE EXISTIR AL MENOS UNA FOTO
    //
    // FOTO = REQUISITO
    // FOTO != EVENTO
    // =========================================================

    const {
      data:
        photoCheck,

      error:
        photoCheckError,
    } =
      await supabase
        .from(
          "owner_property_media"
        )
        .select(
          "id"
        )
        .eq(
          "lead_id",
          ownerLeadId
        )
        .eq(
          "media_type",
          "photo"
        )
        .limit(
          1
        )

    if (
      photoCheckError
    ) {
      throw new Error(
        photoCheckError
          .message
      )
    }

    if (
      !photoCheck ||
      photoCheck.length ===
        0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property requires at least one photo",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 7. CAMBIO DE ESTADO DE NEGOCIO
    //
    // FUENTE DE VERDAD:
    // owner_property_completions.status
    //
    // draft -> submitted
    //
    // ESTE ES EL EVENTO.
    // =========================================================

    if (
      completion.status !==
      "submitted"
    ) {
      const {
        error:
          completionUpdateError,
      } =
        await supabase
          .from(
            "owner_property_completions"
          )
          .update({
            status:
              "submitted",
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
        completionUpdateError
      ) {
        throw new Error(
          completionUpdateError
            .message
        )
      }
    }

    // =========================================================
    // 8. BUSCAR MATCHES ACTIVOS
    // =========================================================

    const {
      data:
        matches,

      error:
        matchesError,
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
          status,
          owner_completed_at
        `)
        .eq(
          "owner_lead_id",
          ownerLeadId
        )
        .gte(
          "score",
          MIN_MATCH_SCORE
        )
        .in(
          "status",
          ACTIVE_MATCH_STATUSES
        )
        .order(
          "score",
          {
            ascending:
              false,
          }
        )

    if (
      matchesError
    ) {
      throw new Error(
        matchesError
          .message
      )
    }

    const activeMatches =
      matches ||
      []

    const matchIds =
      activeMatches
        .map(
          (
            match
          ) =>
            clean(
              match.id
            )
        )
        .filter(
          Boolean
        )

    // =========================================================
    // 9. MARCAR owner_completed_at
    //
    // TAMBIÉN ES ESTADO DE NEGOCIO.
    //
    // Solamente si todavía está NULL.
    // Nunca pisamos la fecha original.
    // =========================================================

    if (
      matchIds.length >
      0
    ) {
      const {
        error:
          ownerCompletedError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            owner_completed_at:
              new Date()
                .toISOString(),
          })
          .in(
            "id",
            matchIds
          )
          .is(
            "owner_completed_at",
            null
          )

      if (
        ownerCompletedError
      ) {
        throw new Error(
          ownerCompletedError
            .message
        )
      }
    }

    // =========================================================
    // 10. EVENTO PUSH DERIVADO DEL ESTADO
    //
    // PROPIEDAD ESTÁ submitted
    // +
    // MATCH ESTÁ ACTIVO
    // =
    // TENANT DEBE ENTERARSE.
    //
    // IMPORTANTE:
    //
    // Ejecutamos notifyLeadOnce SIEMPRE que el estado actual
    // sea submitted.
    //
    // ¿Por qué?
    //
    // Porque si la request anterior cambió a submitted pero
    // murió antes de enviar el Push, una segunda request
    // recupera el evento.
    //
    // event_key UNIQUE evita duplicados.
    // =========================================================

    const tenantNotifications:
      Array<{
        match_id:
          string

        tenant_lead_id:
          string

        url:
          string | null

        ok:
          boolean

        result:
          unknown
      }> =
      []

    for (
      const match
      of activeMatches
    ) {
      const matchId =
        clean(
          match.id
        )

      const tenantLeadId =
        clean(
          match
            .tenant_lead_id
        )

      if (
        !matchId ||
        !tenantLeadId
      ) {
        continue
      }

      try {
        // =====================================================
        // DESTINO ESTABLE DEL TENANT
        // =====================================================

        const tokenResult =
          await postInternal(
            request,
            "/api/tenant-matches-token",
            {
              tenant_lead_id:
                tenantLeadId,
            }
          )

        const tenantUrl =
          tokenResult.ok &&
          tokenResult
            .data
            ?.matches_url
            ? clean(
                tokenResult
                  .data
                  .matches_url
              )
            : ""

        if (
          !tenantUrl
        ) {
          tenantNotifications
            .push({
              match_id:
                matchId,

              tenant_lead_id:
                tenantLeadId,

              url:
                null,

              ok:
                false,

              result: {
                error:
                  "Could not resolve tenant URL",

                status:
                  tokenResult
                    .status,
              },
            })

          continue
        }

        // =====================================================
        // UN SOLO EVENTO LÓGICO POR MATCH
        // =====================================================

        const pushResult =
          await notifyLeadOnce({
            eventKey:
              `owner_property_submitted:tenant:${matchId}`,

            eventType:
              "owner_property_submitted",

            leadId:
              tenantLeadId,

            entityType:
              "match",

            entityId:
              matchId,

            title:
              "Verlo · Propiedad lista",

            body:
              "La propiedad compatible ya está completa. Podés verla y decidir si te interesa.",

            url:
              tenantUrl,
          })

        tenantNotifications
          .push({
            match_id:
              matchId,

            tenant_lead_id:
              tenantLeadId,

            url:
              tenantUrl,

            ok:
              true,

            result:
              pushResult,
          })
      } catch (
        notificationError
      ) {
        console.error(
          "owner completion tenant notification error:",
          {
            matchId,
            tenantLeadId,
            notificationError,
          }
        )

        tenantNotifications
          .push({
            match_id:
              matchId,

            tenant_lead_id:
              tenantLeadId,

            url:
              null,

            ok:
              false,

            result:
              notificationError instanceof
              Error
                ? notificationError
                    .message
                : String(
                    notificationError
                  ),
          })
      }
    }

    // =========================================================
    // 11. CONTAR MEDIA ACTUAL
    // =========================================================

    const {
      data:
        allMedia,

      error:
        allMediaError,
    } =
      await supabase
        .from(
          "owner_property_media"
        )
        .select(`
          id,
          media_type
        `)
        .eq(
          "lead_id",
          ownerLeadId
        )

    if (
      allMediaError
    ) {
      throw new Error(
        allMediaError
          .message
      )
    }

    const totalMedia =
      allMedia ||
      []

    const totalPhotos =
      totalMedia
        .filter(
          (
            item
          ) =>
            item.media_type ===
            "photo"
        )
        .length

    const totalVideos =
      totalMedia
        .filter(
          (
            item
          ) =>
            item.media_type ===
            "video"
        )
        .length

    // =========================================================
    // 12. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok:
        true,

      owner_lead_id:
        ownerLeadId,

      completion_id:
        completionId,

      completion_status:
        "submitted",

      media_added:
        cleanMedia.length,

      total_media:
        totalMedia.length,

      total_photos:
        totalPhotos,

      total_videos:
        totalVideos,

      matches_found:
        activeMatches.length,

      owner_completed_matches:
        matchIds.length,

      tenant_notifications:
        tenantNotifications,

      token_reusable:
        true,

      token_expires_at:
        accessToken
          .expires_at,
    })
  } catch (
    error
  ) {
    console.error(
      "owner completion error:",
      error
    )

    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof
          Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status:
          500,
      }
    )
  }
}
