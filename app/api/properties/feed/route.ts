import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
const { data, error } = await supabase
  .from("properties")
  .select(`
    id,
    title,
    city,
    zone,
    price,
    currency,
    short_description,
    property_media (
      url,
      position
    )
  `)
  .or("available.is.null,available.eq.true")
  .order("created_at", { ascending: false });


  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((p: any) => {
    const cover =
      (p.property_media ?? [])
        .slice()
        .sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999))[0]
        ?.url ?? null;

    return {
      id: p.id,
      title: p.title ?? "Propiedad en alquiler",
      city: p.city ?? null,
      zone: p.zone ?? null,
      price: p.price ?? null,
      currency: p.currency ?? "ARS",
      cover_url: cover,
      short_description: p.short_description ?? null,
    };
  });

  return NextResponse.json(normalized);
}
