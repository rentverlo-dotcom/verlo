import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type MediaItem = {
  key?: string
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

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const ownerLeadId =
      clean(
        body?.owner_lead_id
      )

    const media:
      MediaItem[] =
      Array.isArray(
        body?.media
      )
        ? body.media
        : []

    if (!ownerLeadId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing owner_lead_id",
        },
        {
          status: 400,
        }
      )
    }

    if (
      media.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subí al menos una foto o video de la propiedad",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR MULTIMEDIA
    // =========================================================

    const validMedia =
      media
        .map(
          (
            item
          ) => {
            const key =
              clean(
                item?.key
              )

            const contentType =
              clean(
                item?.contentType
              )

            const mediaType =
              item?.mediaType ===
                "video" ||
              contentType.startsWith(
                "video/"
              )
                ? "video"
                : item?.mediaType ===
                    "photo" ||
                  contentType.startsWith(
                    "image/"
                  )
                  ? "photo"
                  : null

            return {
              ...item,
              key,
              contentType,
              mediaType,
            }
          }
        )
        .filter(
          (
            item
          ) =>
            Boolean(
              item.key
            ) &&
            Boolean(
              item.mediaType
            )
        )

    if (
      validMedia.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subí al menos una foto o video válido",
        },
        {
          status: 400,
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

    // =========================================================
    // 2. VALIDAR QUE EL LEAD SEA OWNER
    // =========================================================

    const {
      data: owner,
      error: ownerError,
    } =
      await supabase
        .from(
          "lead_intake"
        )
        .select(`
          id,
          role,
          intent
        `)
        .eq(
          "id",
          ownerLeadId
        )
        .single()

    if (
      ownerError ||
      !owner
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Owner lead not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      owner.role !==
        "owner" ||
      owner.intent !==
        "owner_new_listing"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Lead is not an owner listing",
        },
        {
          status: 400,
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
          r2_key
        `)
        .eq(
          "lead_id",
          ownerLeadId
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
    // 4. PREPARAR NUEVA MULTIMEDIA
    //
    // completion_id = NULL porque esta es la carga inicial.
    //
    // Luego el owner podrá volver por /propiedad/[token]
    // y agregar más fotos/videos.
    // =========================================================

    const rows =
      validMedia
        .filter(
          (
            item
          ) =>
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
              null,

            lead_id:
              ownerLeadId,

            owner_prospect_id:
              null,

            match_id:
              null,

            media_type:
              item.mediaType,

            r2_bucket:
              r2Bucket,

            r2_key:
              clean(
                item.key
              ),

            public_url:
              clean(
                item.publicUrl
              ) ||
              null,

            original_filename:
              clean(
                item.filename
              ) ||
              null,

            content_type:
              clean(
                item.contentType
              ) ||
              null,

            size_bytes:
              Number(
                item.size ||
                  0
              ) ||
              null,

            position:
              existingKeys.size +
              index,
          })
        )

    // =========================================================
    // 5. INSERTAR
    // =========================================================

    if (
      rows.length >
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
            rows
          )

      if (
        mediaInsertError
      ) {
        throw new Error(
          mediaInsertError.message
        )
      }
    }

    // =========================================================
    // 6. CONFIRMAR QUE EL OWNER TIENE MULTIMEDIA
    // =========================================================

    const {
      data:
        storedMedia,

      error:
        storedMediaError,
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
        .limit(
          1
        )

    if (
      storedMediaError
    ) {
      throw new Error(
        storedMediaError.message
      )
    }

    if (
      !storedMedia ||
      storedMedia.length ===
        0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No pudimos registrar la multimedia de la propiedad",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 7. REEJECUTAR PILOT PARA TENANTS
    //
    // Desde acá sabemos que el owner ya tiene al menos
    // una foto O un video.
    // =========================================================

    let pilotMatch:
      Record<
        string,
        unknown
      > = {
        triggered:
          false,
      }

    try {
      const pilotUrl =
        new URL(
          "/api/pilot-matches",
          request.url
        )

      const response =
        await fetch(
          pilotUrl,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                send:
                  true,

                lead_ids: [
                  ownerLeadId,
                ],

                notify_roles: [
                  "tenant",
                ],

                limit:
                  200,
              }),
          }
        )

      const data =
        await response
          .json()
          .catch(
            () =>
              null
          )

      pilotMatch = {
        triggered:
          true,

        ok:
          response.ok &&
          data?.ok !==
            false,

        status:
          response.status,

        response:
          data,
      }
    } catch (
      error
    ) {
      pilotMatch = {
        triggered:
          true,

        ok:
          false,

        error:
          error instanceof
          Error
            ? error.message
            : "Pilot dispatch failed",
      }
    }

    // =========================================================
    // 8. CONTAR MEDIA
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
        allMediaError.message
      )
    }

    const totalMedia =
      allMedia ||
      []

    const totalPhotos =
      totalMedia.filter(
        (
          item
        ) =>
          item.media_type ===
          "photo"
      ).length

    const totalVideos =
      totalMedia.filter(
        (
          item
        ) =>
          item.media_type ===
          "video"
      ).length

    // =========================================================
    // 9. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok:
        true,

      owner_lead_id:
        ownerLeadId,

      received:
        validMedia.length,

      inserted:
        rows.length,

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

      pilot_match:
        pilotMatch,
    })
  } catch (
    error
  ) {
    console.error(
      "owner-initial-media error:",
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
