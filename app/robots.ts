import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/login",
        "/mi-verlo",
        "/mi-alquiler",
        "/cierre/",
        "/matches/",
        "/candidatos/",
        "/propiedad/",
        "/activar/",
        "/final/",
        "/contracts/",
        "/tenant/",
        "/owner/",
        "/inquilino",
        "/propietario/",
        "/temporarios/mi-verlo",
      ],
    }],
    sitemap: "https://verlo.lat/sitemap.xml",
    host: "https://verlo.lat",
  }
}
