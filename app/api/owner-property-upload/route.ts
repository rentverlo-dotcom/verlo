import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  buildR2Key,
  createR2UploadUrl,
  getR2PublicUrl,
} from "@/lib/r2"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

function safeFilename(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .slice(
      0,
      120
    )
}

export async function POST(
  req: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing server configuration",
        },
        {
          status: 500,
        }
      )
    }

    // =========================================================
    // 1. RECIBIR ARCHIVO DESDE VERLO
    //
    // IMPORTANTE:
    // El navegador YA NO sube directo a R2.
    //
    // navegador -> verlo.lat -> R2
    // =========================================================

    let formData:
      FormData

    try {
      formData =
        await req.formData()
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid multipart form data",
        },
        {
          status: 400,
        }
      )
    }

    const token =
      clean(
        formData.get(
          "token"
        )
      )

    const fileValue =
      formData.get(
        "file"
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

    if (
      !(fileValue instanceof File)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing file",
        },
        {
          status: 400,
        }
      )
    }

    const file =
      fileValue

    const filename =
      safeFilename(
        clean(
          file.name
        ) ||
          "archivo"
      )

    const contentType =
      clean(
        file.type
      )

    if (
      !contentType
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing contentType",
        },
        {
          status: 400,
        }
      )
    }

    const isPhoto =
      contentType.startsWith(
        "image/"
      )

    const isVideo =
      contentType.startsWith(
        "video/"
      )

    if (
      !isPhoto &&
      !isVideo
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Only photos and videos are allowed",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 2. VALIDAR TOKEN DEL OWNER
    // =========================================================

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
            "Token expired",
        },
        {
          status: 403,
        }
      )
    }

    if (
      !accessToken
        .owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Owner missing",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !accessToken
        .completion_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Property completion missing",
        },
        {
          status: 409,
        }
      )
    }

    const ownerLeadId =
      clean(
        accessToken
          .owner_lead_id
      )

    const completionId =
      clean(
        accessToken
          .completion_id
      )

    // =========================================================
    // 3. GENERAR KEY EN R2
    // =========================================================

    const key =
      buildR2Key({
        folder:
          "owner-media",

        id:
          `${ownerLeadId}/${completionId}`,

        filename,
      })

    // =========================================================
    // 4. GENERAR URL PRESIGNADA
    //
    // Esta URL ahora se consume DESDE EL SERVIDOR.
    // El celular nunca la recibe.
    // =========================================================

    const uploadUrl =
      await createR2UploadUrl({
        key,
        contentType,
      })

    // =========================================================
    // 5. LEER ARCHIVO RECIBIDO
    // =========================================================

    const arrayBuffer =
      await file.arrayBuffer()

    const fileBuffer =
      Buffer.from(
        arrayBuffer
      )

    // =========================================================
    // 6. SERVIDOR VERLO -> R2
    //
    // ESTE ES EL CAMBIO CENTRAL.
    // Ya no existe:
    //
    // navegador -> r2.cloudflarestorage.com
    //
    // Ahora:
    //
    // navegador -> verlo.lat -> R2
    // =========================================================

    const r2Response =
      await fetch(
        uploadUrl,
        {
          method:
            "PUT",

          headers: {
            "Content-Type":
              contentType,
          },

          body:
            fileBuffer,
        }
      )

    if (
      !r2Response.ok
    ) {
      const r2Text =
        await r2Response
          .text()
          .catch(
            () => ""
          )

      console.error(
        "owner-property-upload R2 error:",
        {
          status:
            r2Response.status,

          statusText:
            r2Response.statusText,

          body:
            r2Text,

          key,

          contentType,

          size:
            file.size,
        }
      )

      return NextResponse.json(
        {
          ok: false,

          error:
            `R2 upload failed. HTTP ${r2Response.status}`,

          detail:
            r2Text ||
            null,
        },
        {
          status: 502,
        }
      )
    }

    // =========================================================
    // 7. URL PÚBLICA
    // =========================================================

    const publicUrl =
      getR2PublicUrl(
        key
      )

    // =========================================================
    // 8. RESPONSE
    //
    // Devuelve directamente el archivo YA SUBIDO.
    // NO devuelve upload_url al navegador.
    // =========================================================

    return NextResponse.json({
      ok: true,

      key,

      public_url:
        publicUrl,

      media_type:
        isVideo
          ? "video"
          : "photo",

      filename,

      content_type:
        contentType,

      size:
        file.size,

      owner_lead_id:
        ownerLeadId,

      completion_id:
        completionId,
    })
  } catch (
    error
  ) {
    console.error(
      "owner-property-upload error:",
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
