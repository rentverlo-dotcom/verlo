import {
  NextResponse,
} from "next/server"

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

export async function POST(
  request: Request
) {
  try {
    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const folder =
      clean(
        body?.folder
      )

    const id =
      clean(
        body?.id
      )

    const filename =
      clean(
        body?.filename
      )

    const contentType =
      clean(
        body?.contentType
      )

    if (
      !folder ||
      !id ||
      !filename
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required fields",
        },
        {
          status: 400,
        }
      )
    }

    if (
      ![
        "owner-media",
        "property-media",
      ].includes(
        folder
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid folder",
        },
        {
          status: 400,
        }
      )
    }

    const key =
      buildR2Key({
        folder,
        id,
        filename,
      })

    /*
     * IMPORTANTE:
     *
     * NO firmamos Content-Type.
     *
     * Desktop / Android / iPhone
     * reciben exactamente la misma
     * URL de upload.
     */
    const uploadUrl =
      await createR2UploadUrl({
        key,
        expiresSeconds:
          3600,
      })

    const publicUrl =
      getR2PublicUrl(
        key
      )

    return NextResponse.json({
      ok: true,

      uploadUrl,

      key,

      publicUrl,

      filename,

      contentType:
        contentType ||
        null,
    })
  } catch (
    error
  ) {
    console.error(
      "R2 presign error:",
      error
    )

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
          Error
            ? error.message
            : "Could not create upload URL",
      },
      {
        status: 500,
      }
    )
  }
}
