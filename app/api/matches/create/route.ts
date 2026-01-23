import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyOwner } from "@/lib/notifyOwner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { tenant_id, property_id } = await req.json();

  // 1. Crear match
  const { data: match, error } = await supabase
    .from("matches")
    .insert({
      tenant_id,
      property_id,
      status: "liked",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 2. Buscar owner + propiedad
  const { data: property } = await supabase
    .from("properties")
    .select("title, owner_id")
    .eq("id", property_id)
    .single();

  const { data: owner } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", property.owner_id)
    .single();

  // 3. Notificar owner
  if (owner?.phone) {
    await notifyOwner({
      phone: owner.phone,
      propertyTitle: property.title,
    });
  }

  return NextResponse.json({ match });
}

