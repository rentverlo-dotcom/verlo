import type { MetadataRoute } from "next"

const origin = "https://verlo.lat"

// Only list real, useful public landing pages. Private tokens, contract
// records, search/filter states and unpublished geo pages stay excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/propietarios`, changeFrequency: "weekly", priority: 0.9 },
  ]
}
