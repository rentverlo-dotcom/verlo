
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "tenant-documents";

function supabaseClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !service) {
    throw new Error("Missing Supabase configuration");
  }

  return {
    auth: createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
    admin: createClient(url, service, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

async function authorize(request: NextRequest) {
  const authorization =
    request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const { auth, admin } = supabaseClients();

  const token = authorization.slice(7).trim();

  const { data: userData, error: userError } =
    await auth.auth.getUser(token);

  if (userError || !userData.user) {
    return null;
  }

  const { data: partner, error: partnerError } =
    await admin
      .from("caucion_partner_users")
      .select("active")
      .eq("user_id", userData.user.id)
      .eq("partner", "powermarket")
      .maybeSingle();

  if (partnerError || !partner?.active) {
    return null;
  }

  return {
    admin,
    userId: userData.user.id,
  };
}

function validUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// GET: lista los documentos de una solicitud.
// No devuelve rutas privadas ni enlaces públicos.
export async function GET(request: NextRequest) {
  try {
    const context = await authorize(request);

    if (!context) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    const applicationId =
      request.nextUrl.searchParams.get("application_id") || "";

    if (!validUUID(applicationId)) {
      return NextResponse.json(
        { ok: false, error: "Solicitud inválida" },
        { status: 400 }
      );
    }

    const { data: application, error: applicationError } =
      await context.admin
        .from("caucion_applications")
        .select("id")
        .eq("id", applicationId)
        .neq("status", "draft")
        .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { ok: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const { data: documents, error } =
      await context.admin
        .from("caucion_documents")
        .select(
          "id, kind, original_filename, created_at"
        )
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        documents: documents || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("PowerMarket documents GET:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron consultar los documentos",
      },
      { status: 500 }
    );
  }
}

// POST: genera un enlace temporal para un documento.
// Solo lo puede solicitar un operador autorizado.
export async function POST(request: NextRequest) {
  try {
    const context = await authorize(request);

    if (!context) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const applicationId = String(
      body?.application_id || ""
    );

    const documentId = String(
      body?.document_id || ""
    );

    if (
      !validUUID(applicationId) ||
      !validUUID(documentId)
    ) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos" },
        { status: 400 }
      );
    }

    const { data: document, error: documentError } =
      await context.admin
        .from("caucion_documents")
        .select(
          "id, private_storage_key, storage_provider"
        )
        .eq("id", documentId)
        .eq("application_id", applicationId)
        .single();

    if (documentError || !document) {
      return NextResponse.json(
        { ok: false, error: "Documento inexistente" },
        { status: 404 }
      );
    }

    if (
      document.storage_provider !== "supabase" ||
      !document.private_storage_key.startsWith(
        `powermarket/${applicationId}/`
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "Documento no disponible" },
        { status: 409 }
      );
    }

    const { data: bucket, error: bucketError } =
      await context.admin.storage.getBucket(BUCKET);

    if (bucketError || !bucket || bucket.public) {
      return NextResponse.json(
        {
          ok: false,
          error: "El almacenamiento no es privado",
        },
        { status: 503 }
      );
    }

    const { data: signed, error: signedError } =
      await context.admin.storage
        .from(BUCKET)
        .createSignedUrl(
          document.private_storage_key,
          60
        );

    if (signedError || !signed?.signedUrl) {
      throw signedError || new Error("Signed URL failed");
    }

    return NextResponse.json(
      {
        ok: true,
        url: signed.signedUrl,
        expires_seconds: 60,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("PowerMarket documents POST:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo abrir el documento",
      },
      { status: 500 }
    );
  }
}
