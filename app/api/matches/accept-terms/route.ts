import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { match_id, tenant_id } = await req.json();

  // 1️⃣ Tenant acepta términos
  const { error } = await supabase
    .from("match_terms")
    .update({
      accepted_by: tenant_id,
      accepted_at: new Date().toISOString(),
    })
    .eq("match_id", match_id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // 2️⃣ Buscar owner para notificar
  const { data: match } = await supabase
    .from("matches")
    .select("property_id")
    .eq("id", match_id)
    .single();

  const { data: property } = await supabase
    .from("properties")
    .select("owner_id, title")
    .eq("id", match?.property_id)
    .single();

  const { data: owner } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", property?.owner_id)
    .single();

  // 3️⃣ WhatsApp mock
  if (owner?.phone) {
    await sendWhatsApp({
      to: owner.phone,
      template: "terms_accepted",
      variables: {
        match_id,
        property_title: property?.title,
      },
      context: {
        trigger: "terms_accepted",
        source: "api/matches/accept-terms",
      },
    });
  }

  return NextResponse.json({ success: true });
}
