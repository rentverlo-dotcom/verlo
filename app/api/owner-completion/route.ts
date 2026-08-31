import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function POST(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

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

    // =========================================================
    // 1. VALIDAR TOKEN DE CARGA DEL OWNER
    //
    // IMPORTANTE:
    //
    // Este token NO se revoca al subir multimedia.
    //
    // El propietario tiene que poder volver al mismo enlace
    // y seguir agregando fotos/videos mientras el token
    // no esté vencido o revocado manualmente.
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
    // 2. LEER MULTIMEDIA YA EXISTENTE
    //
    // La propiedad necesita como mínimo UNA pieza multimedia:
    //
    // - foto
    // - video
    //
    // Puede haber sido cargada previamente o venir ahora.
    // =========================================================

    const {
      data: existingMediaBefore,
      error: existingMediaBeforeError,
    } = await supabase
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
      existingMediaBeforeError
    ) {
      throw new Error(
        existingMediaBeforeError.message
      )
    }

    const hadMediaBefore =
      Boolean(
        existingMediaBefore &&
        existingMediaBefore.length > 0
      )

    const incomingHasMedia =
      (
        media as MediaItem[]
      ).some(
        (item) =>
          Boolean(
            clean(
              item?.key
            )
          )
      )

    if (
      !hadMediaBefore &&
      !incomingHasMedia
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "At least one property photo or video is required",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 3. MARCAR PROPIEDAD COMPLETA
    //
    // submitted significa que el owner ya completó esta etapa.
    //
    // NO significa que no pueda volver a cargar multimedia.
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
    // 4. PREPARAR MULTIMEDIA NUEVA SIN DUPLICAR
    // =========================================================

    const existingKeys =
      new Set(
        (
          existingMediaBefore ||
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
          (item) => {
            const key =
              clean(
                item?.key
              )

            return (
              Boolean(key) &&
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
                item.contentType
              )

            const mediaType =
              item.mediaType ===
              "video"
                ? "video"
                : item.mediaType ===
                  "photo"
                  ? "photo"
                  : contentType.startsWith(
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
                existingKeys.size +
                index,
            }
          }
        )

    // =========================================================
    // 5. GUARDAR MULTIMEDIA NUEVA
    // =========================================================

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
    // 6. CONFIRMAR QUE EXISTE AL MENOS UNA FOTO O VIDEO
    // =========================================================

    const {
      data: finalMediaCheck,
      error: finalMediaCheckError,
    } = await supabase
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
      .limit(1)

    if (
      finalMediaCheckError
    ) {
      throw new Error(
        finalMediaCheckError.message
      )
    }

    if (
      !finalMediaCheck ||
      finalMediaCheck.length ===
        0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property requires at least one photo or video",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 7. BUSCAR MATCHES DE ESTA PROPIEDAD
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

    const activeMatches =
      matches || []

    // =========================================================
    // 8. MARCAR OWNER COMPLETO EN TODOS SUS MATCHES
    //
    // Si ya estaba completo, simplemente actualizamos
    // owner_completed_at.
    // =========================================================

    const now =
      new Date()
        .toISOString()

    const matchIds =
      activeMatches.map(
        (match) =>
          match.id
      )

    if (
      matchIds.length >
      0
    ) {
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
          ownerCompletedError.message
        )
      }
    }

    // =========================================================
    // 9. NOTIFICAR TENANTS CUANDO APARECE LA PRIMERA MULTIMEDIA
    //
    // IMPORTANTE:
    //
    // NO notificamos nuevamente cada vez que el owner agrega
    // otra foto o video.
    //
    // Solo hacemos la llamada cuando:
    //
    // - antes no tenía multimedia
    // - ahora sí tiene multimedia
    //
    // pilot-matches sigue siendo quien decide qué tenant
    // realmente puede entrar al flujo.
    // =========================================================

    let tenantNotificationAttempted =
      false

    let tenantNotificationOk =
      false

    let tenantNotificationStatus:
      number | null =
      null

    let tenantNotificationResponse:
      unknown =
      null

    if (
      !hadMediaBefore &&
      cleanMedia.length > 0 &&
      matchIds.length > 0
    ) {
      tenantNotificationAttempted =
        true

      try {
        const origin =
          new URL(
            request.url
          ).origin

        const pilotResponse =
          await fetch(
            `${origin}/api/pilot-matches`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  send: true,

                  lead_ids: [
                    ownerLeadId,
                  ],

                  notify_roles: [
                    "tenant",
                  ],
                }),
            }
          )

        tenantNotificationStatus =
          pilotResponse.status

        const pilotData =
          await pilotResponse
            .json()
            .catch(
              async () => {
                const text =
                  await pilotResponse
                    .text()
                    .catch(
                      () =>
                        ""
                    )

                return {
                  raw:
                    text,
                }
              }
            )

        tenantNotificationResponse =
          pilotData

        tenantNotificationOk =
          pilotResponse.ok

        if (
          !pilotResponse.ok
        ) {
          console.error(
            "tenant notification after owner media failed:",
            {
              status:
                pilotResponse.status,

              response:
                pilotData,

              ownerLeadId,
            }
          )
        }
      } catch (
        notificationError
      ) {
        console.error(
          "tenant notification after owner media error:",
          notificationError
        )

        tenantNotificationResponse =
          notificationError instanceof
          Error
            ? notificationError.message
            : String(
                notificationError
              )
      }
    }

    // =========================================================
    // 10. TOKEN
    //
    // NO SE REVOCA.
    //
    // El owner puede volver al mismo link y seguir cargando
    // fotos/videos mientras expires_at siga vigente.
    // =========================================================

    // =========================================================
    // 11. CONTAR MULTIMEDIA TOTAL ACTUAL
    // =========================================================

    const {
      data: allMedia,
      error: allMediaError,
    } = await supabase
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
      console.error(
        "owner total media fetch error:",
        allMediaError
      )
    }

    const totalMedia =
      allMedia ||
      []

    const totalPhotos =
      totalMedia.filter(
        (item) =>
          item.media_type ===
          "photo"
      ).length

    const totalVideos =
      totalMedia.filter(
        (item) =>
          item.media_type ===
          "video"
      ).length

    // =========================================================
    // 12. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      owner_lead_id:
        ownerLeadId,

      completion_id:
        completionId,

      media_added:
        cleanMedia.length,

      total_media:
        totalMedia.length,

      total_photos:
        totalPhotos,

      total_videos:
        totalVideos,

      has_media:
        totalMedia.length >
        0,

      has_photo:
        totalPhotos >
        0,

      has_video:
        totalVideos >
        0,

      matches_found:
        activeMatches.length,

      owner_completed_matches:
        matchIds.length,

      token_reusable:
        true,

      token_expires_at:
        accessToken.expires_at,

      tenant_notification_attempted:
        tenantNotificationAttempted,

      tenant_notification_ok:
        tenantNotificationOk,

      tenant_notification_status:
        tenantNotificationStatus,

      tenant_notification_response:
        tenantNotificationResponse,
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
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
