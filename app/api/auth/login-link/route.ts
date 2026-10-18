import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email.includes("@")) return NextResponse.json({ ok: false }, { status: 400 });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: lead, error: lookupError } = await admin
    .from("lead_intake")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ ok: false }, { status: 500 });
  if (!lead) return NextResponse.json({ ok: true });
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: "https://verlo.lat/login?next=%2Fmi-verlo" },
  });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
