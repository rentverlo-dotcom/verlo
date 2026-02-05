import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      title,
      city,
      zone,
      price,
      currency,
      short_description,
      property_media:image_url
    `)
    .eq('available', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const normalized = data.map(p => ({
    id: p.id,
    title: p.title,
    city: p.city,
    zone: p.zone,
    price: p.price,
    currency: p.currency,
    cover_url: p.property_media?.[0] ?? null,
    short_description: p.short_description ?? null,
  }))

  return NextResponse.json(normalized)
}

