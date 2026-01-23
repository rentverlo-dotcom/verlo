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
      address,
      price,
      city,
      property_media (
        image_url
      )
    `)
    .eq("available", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // normalizamos para el deck
  const normalized = data.map((p) => ({
    id: p.id,
    title: p.title,
    address: p.address,
    price: p.price,
    image_url: p.property_media?.[0]?.image_url ?? null,
  }));

  return NextResponse.json(normalized);
}
