import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { match_id } = await req.json();

  if (!match_id) {
    return NextResponse.json(
      { error: "match_id required" },
      { status: 400 }
    );
  }

  // 1️⃣ Obtener match + demand
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, demand_id")
    .eq("id", match_id)
    .single();

  if (matchError || !match) {
    return NextResponse.json(
      { error: "match not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Aprobar garantía automáticamente
  await supabase
    .from("match_guarantee_reviews")
    .upsert({
      match_id: match_id,
      demand_id: match.demand_id,
      status: "approved",
      reviewed_by: null,
      reviewed_at: new Date().toISOString(),
    }, { onConflict: "match_id" });

  // 3️⃣ Transición real del match → approved
  const { error: transitionError } = await supabase.rpc(
    "transition_match_status",
    {
      p_match_id: match_id,
      p_new_status: "approved",
    }
  );

  if (transitionError) {
    return NextResponse.json(
      { error: transitionError.message },
      { status: 400 }
    );
  }

  // 4️⃣ Buscar tenant para notificar
  const { data: demand } = await supabase
    .from("demands")
    .select("tenant_id")
    .eq("id", match.demand_id)
    .single();

  const { data: tenant } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", demand?.tenant_id)
    .single();

  // 5️⃣ WhatsApp mock
  if (tenant?.phone) {
    await sendWhatsApp({
      to: tenant.phone,
      template: "match_approved",
      variables: { match_id },
      context: {
        trigger: "match_approved_full",
        source: "api/matches/approve",
      },
    });
  }

  return NextResponse.json({ success: true });
}
