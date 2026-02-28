import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const {
    match_id,
    price,
    deposit,
    expenses_included,
    start_date,
    end_date,
    duration_months,
    proposed_by
  } = await req.json();

  // 1️⃣ Crear match_terms
  const { error } = await supabase
    .from("match_terms")
    .insert({
      match_id,
      price,
      deposit,
      expenses_included,
      start_date,
      end_date,
      duration_months,
      proposed_by
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // 2️⃣ Buscar tenant
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

  // 3️⃣ WhatsApp mock
  if (tenant?.phone) {
    await sendWhatsApp({
      to: tenant.phone,
      template: "terms_proposed",
      variables: {
        match_id,
        price,
        duration_months
      },
      context: {
        trigger: "terms_proposed",
        source: "api/matches/propose"
      }
    });
  }

  return NextResponse.json({ success: true });
}
