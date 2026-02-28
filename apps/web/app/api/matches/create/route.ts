// app/api/matches/create/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyOwner } from "@/lib/notifyOwner";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenant_id, property_id } = body;

    if (!tenant_id || !property_id) {
      return NextResponse.json(
        { error: "tenant_id y property_id son requeridos" },
        { status: 400 }
      );
    }

    // 1️⃣ Crear match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        tenant_id,
        property_id,
        status: "liked",
      })
      .select()
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: matchError?.message || "No se pudo crear match" },
        { status: 400 }
      );
    }

    // 2️⃣ Buscar propiedad
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, title, owner_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
        { status: 404 }
      );
    }

    // 3️⃣ Buscar owner profile
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", property.owner_id)
      .single();

    const ownerPhone = ownerProfile?.phone;

    // 4️⃣ Notificar owner (función existente)
    if (ownerPhone) {
      await notifyOwner({
        phone: ownerPhone,
        propertyTitle: property.title,
      });
    }

    // 5️⃣ WhatsApp mock (para test real)
    if (ownerPhone) {
      await sendWhatsApp({
        to: ownerPhone,
        template: "match_created",
        variables: {
          match_id: match.id,
          property_id: property.id,
          property_title: property.title,
        },
        context: {
          trigger: "match_created",
          source: "api/matches/create",
        },
      });
    }

    return NextResponse.json({ match });

  } catch (err: any) {
    console.error("MATCH CREATE ERROR:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

