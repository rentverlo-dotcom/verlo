import type { MetadataRoute } from "next"
import { locations } from "@/lib/seo/argentina-locations"

const origin = "https://verlo.lat"

// Only list public landings with meaningful localized context.
// Other catalog zones remain navigable but noindex until enriched.
export default function sitemap(): MetadataRoute.Sitemap {
  const featured = locations
    .filter(location => location.slug !== "olivos" && location.featured && Boolean(location.highlight))
    .map(location => ({
      url: `${origin}/alquileres/${location.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/propietarios`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/alquileres`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/alquileres/olivos`, changeFrequency: "weekly", priority: 0.8 },
    ...featured,
  ]
}
