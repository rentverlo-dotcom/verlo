import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { match_id } = await req.json();

  // 1️⃣ Transición real vía función
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

  // 2️⃣ Buscar tenant para notificar
  const { data: match } = await supabase
    .from("matches")
    .select("demand_id")
    .eq("id", match_id)
    .single();

  const { data: demand } = await supabase
    .from("demands")
    .select("tenant_id")
    .eq("id", match?.demand_id)
    .single();

  const { data: tenant } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", demand?.tenant_id)
    .single();

  // 3️⃣ WhatsApp mock al tenant
  if (tenant?.phone) {
    await sendWhatsApp({
      to: tenant.phone,
      template: "match_approved",
      variables: {
        match_id,
      },
      context: {
        trigger: "match_approved",
        source: "api/matches/approve",
      },
    });
  }

  return NextResponse.json({ success: true });
}
