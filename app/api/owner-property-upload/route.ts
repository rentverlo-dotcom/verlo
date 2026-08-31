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

    const body =
      await req
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    const filename =
      safeFilename(
        clean(
          body?.filename
        ) ||
          "archivo"
      )

    const contentType =
      clean(
        body?.contentType
      )

    if (
      !token ||
      !contentType
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing token or contentType",
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
    // 2. GENERAR KEY USANDO EL MISMO HELPER CENTRAL DE R2
    //
    // Mantiene owner + completion separados dentro del path.
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
    // 3. GENERAR URL PRESIGNADA
    //
    // IMPORTANTE:
    // usamos EXACTAMENTE createR2UploadUrl de lib/r2.ts
    // igual que /api/r2/presign.
    //
    // Eliminamos completamente el segundo implementador
    // manual de AWS Signature V4 que tenía este endpoint.
    // =========================================================

    const uploadUrl =
      await createR2UploadUrl({
        key,
        contentType,
      })

    // =========================================================
    // 4. URL PÚBLICA
    // =========================================================

    const publicUrl =
      getR2PublicUrl(
        key
      )

    // =========================================================
    // 5. RESPONSE
    //
    // MANTENEMOS LOS MISMOS NOMBRES QUE YA CONSUME
    // app/propiedad/[token]/page.tsx
    // =========================================================

    return NextResponse.json({
      ok: true,

      upload_url:
        uploadUrl,

      key,

      public_url:
        publicUrl,

      media_type:
        isVideo
          ? "video"
          : "photo",

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
