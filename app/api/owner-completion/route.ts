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
    // 2. VALIDAR QUE LA PROPIEDAD YA TENGA AL MENOS UNA FOTO
    //
    // NUEVO FLUJO:
    //
    // El owner ya tuvo que cargar al menos una foto
    // en el formulario inicial.
    //
    // En esta segunda etapa puede subir más fotos/videos,
    // pero NO está obligado a agregar otra foto.
    // =========================================================

    const {
      data: existingOwnerPhotos,
      error: existingOwnerPhotosError,
    } = await supabase
      .from(
        "owner_property_media"
      )
      .select(`
        id,
        r2_key
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
      existingOwnerPhotosError
    ) {
      throw new Error(
        existingOwnerPhotosError.message
      )
    }

    const incomingHasPhoto =
      (
        media as MediaItem[]
      ).some(
        (item) =>
          item?.key &&
          (
            item.mediaType ===
              "photo" ||
            (
              !item.mediaType &&
              !item.contentType
                ?.startsWith(
                  "video/"
                )
            )
          )
      )

    const hasExistingPhoto =
      Boolean(
        existingOwnerPhotos &&
        existingOwnerPhotos.length >
          0
      )

    if (
      !hasExistingPhoto &&
      !incomingHasPhoto
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "At least one property photo is required",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 3. MARCAR PROPIEDAD COMPLETA
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
    // 4. GUARDAR MEDIA ADICIONAL SIN DUPLICAR
    //
    // IMPORTANTE:
    //
    // Las fotos iniciales siguen vinculadas al owner por lead_id
    // y pueden tener completion_id = null.
    //
    // Las fotos/videos agregados ahora sí quedan vinculados
    // a esta completion.
    //
    // tenant-matches-view busca toda la media por lead_id,
    // por lo que ambas conviven correctamente.
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
    // 5. CONFIRMAR QUE SIGUE EXISTIENDO AL MENOS UNA FOTO
    //
    // Esto también contempla una eventual llamada donde
    // la primera foto venga junto con esta completion.
    // =========================================================

    const {
      data: finalPhotoCheck,
      error: finalPhotoCheckError,
    } = await supabase
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
      finalPhotoCheckError
    ) {
      throw new Error(
        finalPhotoCheckError.message
      )
    }

    if (
      !finalPhotoCheck ||
      finalPhotoCheck.length ===
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
    // 6. MATCHES DE ESTA PROPIEDAD
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

    // =========================================================
    // 7. SI NO HAY MATCHES
    //
    // La completion igualmente queda submitted.
    // Cerramos el token y terminamos.
    // =========================================================

    if (
      !matches ||
      matches.length ===
        0
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

        media_added:
          cleanMedia.length,

        has_photo:
          true,

        matches_found:
          0,

        owner_completed_matches:
          0,

        tenants_notified:
          0,
      })
    }

    // =========================================================
    // 8. MARCAR OWNER COMPLETO EN TODOS SUS MATCHES
    //
    // owner_completed_at ahora significa:
    //
    // "El propietario completó la segunda etapa".
    //
    // YA NO significa:
    // "recién ahora el tenant puede ver la propiedad".
    //
    // El tenant pudo verla antes, desde que existió
    // match >= 80 + al menos una foto inicial.
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
    // 9. NO VOLVER A NOTIFICAR AL TENANT
    //
    // FLUJO NUEVO:
    //
    // FORM OWNER INICIAL
    // ↓
    // MATCH
    // ↓
    // FOTO INICIAL GUARDADA
    // ↓
    // owner-initial-media
    // ↓
    // pilot-matches notify_roles:["tenant"]
    // ↓
    // TENANT RECIBE SU WHATSAPP
    //
    // Por lo tanto esta completion NO debe volver a mandar
    // GHL_TENANT_MATCH_READY_WEBHOOK_URL ni generar otra
    // notificación del mismo match.
    //
    // Esta etapa solamente enriquece la propiedad y marca
    // owner_completed_at.
    // =========================================================

    // =========================================================
    // 10. CERRAR TOKEN DE CARGA DEL OWNER
    // =========================================================

    const {
      error: revokeError,
    } = await supabase
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

    if (
      revokeError
    ) {
      console.error(
        "owner property token revoke error:",
        revokeError
      )
    }

    // =========================================================
    // 11. CONTAR MEDIA TOTAL ACTUAL DE LA PROPIEDAD
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

      has_photo:
        totalPhotos > 0,

      matches_found:
        matches.length,

      owner_completed_matches:
        matchIds.length,

      tenants_notified:
        0,

      tenant_notification:
        "handled_before_completion",
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
