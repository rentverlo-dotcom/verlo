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
}

function clean(value: unknown) {
  return String(value || "").trim()
}

export async function POST(request: Request) {
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
        .catch(() => ({}))

    const ownerLeadId =
      clean(
        body?.owner_lead_id
      )

    const media: MediaItem[] =
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
      media.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subí al menos una foto de la propiedad",
        },
        {
          status: 400,
        }
      )
    }

    const validMedia =
      media.filter(
        (item) => {
          const key =
            clean(
              item?.key
            )

          const contentType =
            clean(
              item?.contentType
            )

          return (
            key &&
            contentType.startsWith(
              "image/"
            )
          )
        }
      )

    if (
      validMedia.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subí al menos una imagen válida",
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
    // 1. VALIDAR QUE EL LEAD SEA UN OWNER REAL
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
    // 2. MEDIA YA GUARDADA PARA ESTE OWNER
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
            (item) =>
              clean(
                item.r2_key
              )
          )
          .filter(Boolean)
      )

    // =========================================================
    // 3. PREPARAR NUEVAS FOTOS
    //
    // completion_id queda NULL porque todavía estamos en
    // la publicación inicial.
    //
    // Más adelante el owner puede completar la propiedad
    // y agregar nuevas fotos vinculadas a una completion.
    // =========================================================

    const rows =
      validMedia
        .filter(
          (item) =>
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
              "photo",

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
    // 4. INSERTAR
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
    // 5. CONFIRMAR QUE EL OWNER TIENE AL MENOS UNA FOTO
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
          id
        `)
        .eq(
          "lead_id",
          ownerLeadId
        )
        .eq(
          "media_type",
          "photo"
        )
        .limit(1)

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
            "No pudimos registrar la foto de la propiedad",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 6. REEJECUTAR PILOT PARA TENANTS
    //
    // IMPORTANTE:
    // pilot-matches se va a modificar para aceptar notify_roles
    // y para no notificar tenants si el owner no tiene media.
    //
    // Cuando llegamos acá ya sabemos que existe al menos 1 foto.
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
                send: true,

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
            () => null
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
    } catch (error) {
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
    // 7. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok: true,

      owner_lead_id:
        ownerLeadId,

      received:
        validMedia.length,

      inserted:
        rows.length,

      has_photo:
        true,

      pilot_match:
        pilotMatch,
    })
  } catch (error) {
    console.error(
      "owner-initial-media error:",
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
