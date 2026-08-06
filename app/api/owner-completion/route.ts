import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars")
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

type MediaItem = {
  key: string
  publicUrl?: string | null
  filename?: string | null
  contentType?: string | null
  size?: number | null
  mediaType?: "photo" | "video"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      token,
      private_address,
      floor_unit,
      expenses_amount,
      availability_status,
      requirements,
      visit_conditions,
      property_notes,
      media = [],
    } = body || {}

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const { data: accessToken, error: tokenError } = await supabase
      .from("match_access_tokens")
      .select("id, match_id, lead_id, owner_prospect_id, audience, expires_at")
      .eq("token", token)
      .eq("audience", "owner")
      .single()

    if (tokenError || !accessToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    if (
      accessToken.expires_at &&
      new Date(accessToken.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "Expired token" }, { status: 403 })
    }

    const { data: completion, error: completionError } = await supabase
      .from("owner_property_completions")
      .insert({
        lead_id: accessToken.lead_id,
        owner_prospect_id: accessToken.owner_prospect_id,
        match_id: accessToken.match_id,
        private_address: private_address || null,
        floor_unit: floor_unit || null,
        expenses_amount: expenses_amount ? Number(expenses_amount) : null,
        availability_status: availability_status || null,
        requirements: requirements || null,
        visit_conditions: visit_conditions || null,
        property_notes: property_notes || null,
        status: "submitted",
      })
      .select("id")
      .single()

    if (completionError || !completion) {
      console.error("owner completion insert error:", completionError)
      return NextResponse.json(
        { error: "Could not save owner completion" },
        { status: 500 }
      )
    }

    const cleanMedia = Array.isArray(media)
      ? media
          .filter((item: MediaItem) => item?.key)
          .map((item: MediaItem, index: number) => ({
            completion_id: completion.id,
            lead_id: accessToken.lead_id,
            owner_prospect_id: accessToken.owner_prospect_id,
            match_id: accessToken.match_id,
            media_type:
              item.mediaType ||
              (item.contentType?.startsWith("video/") ? "video" : "photo"),
            r2_bucket: "verlo",
            r2_key: item.key,
            public_url: item.publicUrl || null,
            original_filename: item.filename || null,
            content_type: item.contentType || null,
            size_bytes: item.size || null,
            position: index,
          }))
      : []

    if (cleanMedia.length > 0) {
      const { error: mediaError } = await supabase
        .from("owner_property_media")
        .insert(cleanMedia)

      if (mediaError) {
        console.error("owner media insert error:", mediaError)
        return NextResponse.json(
          { error: "Completion saved but media failed" },
          { status: 500 }
        )
      }
    }

    if (accessToken.match_id) {
      await supabase
        .from("lead_matches")
        .update({
          owner_completed_at: new Date().toISOString(),
        })
        .eq("id", accessToken.match_id)
    }

    await supabase
      .from("match_access_tokens")
      .update({
        used_at: new Date().toISOString(),
      })
      .eq("id", accessToken.id)

    return NextResponse.json({
      ok: true,
      completion_id: completion.id,
      media_count: cleanMedia.length,
    })
  } catch (error) {
    console.error("owner completion error:", error)
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    )
  }
}
