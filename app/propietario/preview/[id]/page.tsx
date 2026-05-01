"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

type MediaItem = {
  url: string
  type: "photo" | "video" | "pdf"
  position: number
}

type Property = {
  price: number | null
  currency: string | null
  property_type: string | null
  sqm: number | null
  description: string | null
  short_description: string | null
  city: string | null
  zone: string | null
  furnished: boolean
  pets_allowed: boolean
  publish_status?: string | null
  property_media: MediaItem[]
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Departamento",
  house: "Casa",
  ph: "PH",
  room: "Habitación",
  local: "Local",
  hotel_room: "Habitación",
}

export default function OwnerPreview() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [property, setProperty] = useState<Property | null>(null)
  const [mediaUrls, setMediaUrls] = useState<
    { url: string; type: MediaItem["type"] }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [currentImg, setCurrentImg] = useState(0)

  useEffect(() => {
    if (!id) return

    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data, error } = await supabase
        .from("properties")
        .select(`
          price,
          currency,
          property_type,
          sqm,
          description,
          short_description,
          city,
          zone,
          furnished,
          pets_allowed,
          publish_status,
          property_media (
            url,
            position,
            type
          )
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        console.error(error)
        setLoading(false)
        return
      }

      setProperty(data)

      if (data.property_media?.length) {
        const signed = await Promise.all(
          data.property_media
            .sort((a: MediaItem, b: MediaItem) => a.position - b.position)
            .map(async (m: MediaItem) => {
              const { data } = await supabase.storage
                .from("media")
                .createSignedUrl(m.url, 3600)

              if (!data) return null

              return {
                url: data.signedUrl,
                type: m.type,
              }
            })
        )

        setMediaUrls(
          signed.filter(Boolean) as {
            url: string
            type: MediaItem["type"]
          }[]
        )
      }

      setLoading(false)
    }

    run()
  }, [id, router])

  const photos = mediaUrls.filter((m) => m.type === "photo")
  const videos = mediaUrls.filter((m) => m.type === "video")

  const goNext = () => {
    if (!photos.length) return
    setCurrentImg((i) => (i + 1) % photos.length)
  }

  const goPrev = () => {
    if (!photos.length) return
    setCurrentImg((i) => (i - 1 + photos.length) % photos.length)
  }

  if (loading) {
    return (
      <main className="preview-page center-page">
        <p>Cargando propiedad...</p>
      </main>
    )
  }

  if (!property) {
    return (
      <main className="preview-page center-page">
        <p>Propiedad no encontrada.</p>
      </main>
    )
  }

  const typeLabel =
    TYPE_LABELS[property.property_type || ""] || property.property_type || ""

  const location = [property.zone, property.city].filter(Boolean).join(", ")
  const description = property.description || property.short_description || ""

  return (
    <main className="preview-page">
      <style jsx global>{`
        :root {
          --pink: #f2a8a9;
          --pink-dark: #c37986;
          --black: #050002;
          --soft: #f2ebec;
          --cream: #efefea;
          --blue: #74bedc;
          --yellow: #e7c776;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--soft);
          color: var(--black);
        }

        .preview-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 12%, rgba(242, 168, 169, 0.45), transparent 28%),
            radial-gradient(circle at 88% 18%, rgba(231, 199, 118, 0.28), transparent 22%),
            radial-gradient(circle at 82% 88%, rgba(116, 190, 220, 0.2), transparent 28%),
            var(--soft);
          padding: 34px 0 80px;
          color: var(--black);
        }

        .center-page {
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 800;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--black);
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .mark {
          width: 34px;
          height: 28px;
          position: relative;
          display: inline-block;
        }

        .mark::before,
        .mark::after {
          content: "";
          position: absolute;
          top: 0;
          width: 21px;
          height: 28px;
          border: 6px solid var(--black);
          border-radius: 999px;
        }

        .mark::before {
          left: 0;
        }

        .mark::after {
          right: 0;
        }

        .mark span {
          position: absolute;
          left: 50%;
          top: 4px;
          transform: translateX(-50%);
          width: 10px;
          height: 20px;
          border-radius: 999px;
          background: var(--pink);
          z-index: 2;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .status-pill {
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.68);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.68);
          font-size: 13px;
          font-weight: 900;
        }

        .status-pill strong {
          color: var(--black);
        }

        .btn {
          min-height: 50px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          font-size: 15px;
          font-weight: 950;
          cursor: pointer;
          transition: transform 150ms ease, box-shadow 150ms ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn-primary {
          background: var(--black);
          color: white;
          box-shadow: 0 16px 34px rgba(5, 0, 2, 0.16);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.72);
          color: var(--black);
        }

        .hero-card {
          border-radius: 44px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(5, 0, 2, 0.08);
          box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
          overflow: hidden;
        }

        .gallery-shell {
          padding: 20px;
          background: rgba(255, 255, 255, 0.38);
        }

        .gallery-frame {
          position: relative;
          width: 100%;
          height: min(64vh, 620px);
          min-height: 360px;
          border-radius: 32px;
          overflow: hidden;
          background:
            radial-gradient(circle at 20% 30%, rgba(242, 168, 169, 0.32), transparent 32%),
            radial-gradient(circle at 80% 70%, rgba(231, 199, 118, 0.18), transparent 28%),
            #050002;
          display: grid;
          place-items: center;
        }

        .gallery-frame img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .empty-gallery {
          height: 420px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 30% 30%, rgba(242, 168, 169, 0.52), transparent 32%),
            rgba(255, 255, 255, 0.65);
          border-radius: 32px;
          color: rgba(5, 0, 2, 0.58);
          font-weight: 900;
        }

        .counter {
          position: absolute;
          right: 18px;
          bottom: 18px;
          padding: 8px 13px;
          border-radius: 999px;
          background: rgba(5, 0, 2, 0.78);
          color: white;
          font-size: 13px;
          font-weight: 950;
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(5, 0, 2, 0.68);
          color: white;
          font-size: 24px;
          font-weight: 800;
          cursor: pointer;
        }

        .arrow.left {
          left: 18px;
        }

        .arrow.right {
          right: 18px;
        }

        .thumbs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 14px 2px 0;
        }

        .thumb {
          width: 86px;
          height: 64px;
          flex: 0 0 auto;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid transparent;
          background: rgba(5, 0, 2, 0.08);
          padding: 0;
          cursor: pointer;
          opacity: 0.55;
        }

        .thumb.active {
          opacity: 1;
          border-color: var(--pink-dark);
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 42px;
          padding: 38px;
        }

        .main-info h1 {
          margin: 0;
          font-size: clamp(42px, 5vw, 72px);
          line-height: 0.94;
          letter-spacing: -0.075em;
          font-weight: 950;
        }

        .main-info h1 span {
          font-size: 20px;
          color: rgba(5, 0, 2, 0.55);
          letter-spacing: -0.03em;
          font-weight: 800;
        }

        .meta-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .type-pill {
          padding: 9px 13px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 13px;
          font-weight: 950;
        }

        .location {
          color: rgba(5, 0, 2, 0.62);
          font-size: 17px;
          font-weight: 750;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 26px;
        }

        .chip {
          padding: 12px 15px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.74);
          font-weight: 900;
          font-size: 14px;
        }

        .divider {
          height: 1px;
          background: rgba(5, 0, 2, 0.1);
          margin: 34px 0;
        }

        .section-title {
          margin: 0 0 12px;
          font-size: 26px;
          letter-spacing: -0.045em;
          font-weight: 950;
        }

        .description {
          color: rgba(5, 0, 2, 0.66);
          font-size: 17px;
          line-height: 1.65;
          white-space: pre-wrap;
        }

        .side-card {
          position: sticky;
          top: 28px;
          align-self: start;
          border-radius: 30px;
          padding: 28px;
          background:
            radial-gradient(circle at 20% 18%, rgba(242, 168, 169, 0.38), transparent 34%),
            rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(5, 0, 2, 0.08);
        }

        .side-card small {
          display: block;
          color: rgba(5, 0, 2, 0.55);
          font-weight: 900;
          margin-bottom: 10px;
        }

        .side-card h2 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -0.06em;
          line-height: 1;
        }

        .side-card p {
          margin: 14px 0 24px;
          color: rgba(5, 0, 2, 0.62);
          line-height: 1.45;
          font-weight: 750;
        }

        .side-card .btn {
          width: 100%;
        }

        .video-section {
          margin-top: 34px;
        }

        .video {
          width: 100%;
          max-height: 420px;
          border-radius: 24px;
          background: #000;
          object-fit: contain;
          overflow: hidden;
        }

        @media (max-width: 960px) {
          .content {
            grid-template-columns: 1fr;
          }

          .side-card {
            position: relative;
            top: auto;
          }
        }

        @media (max-width: 640px) {
          .container {
            width: min(100% - 28px, 1180px);
          }

          .preview-page {
            padding-top: 22px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .top-actions {
            width: 100%;
          }

          .top-actions .btn,
          .top-actions .status-pill {
            width: 100%;
            text-align: center;
          }

          .hero-card {
            border-radius: 30px;
          }

          .gallery-shell {
            padding: 12px;
          }

          .gallery-frame {
            height: 420px;
            min-height: 320px;
            border-radius: 24px;
          }

          .content {
            padding: 24px;
          }

          .main-info h1 {
            font-size: 46px;
          }

          .arrow {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <div className="container">
        <div className="topbar">
          <a href="/" className="brand">
            verlo
            <span className="mark" aria-hidden="true">
              <span />
            </span>
          </a>

          <div className="top-actions">
            <div className="status-pill">
              Estado: <strong>{property.publish_status || "draft"}</strong>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => router.push("/owner")}
            >
              Volver a mis propiedades
            </button>
          </div>
        </div>

        <section className="hero-card">
          <div className="gallery-shell">
            {photos.length > 0 ? (
              <>
                <div className="gallery-frame">
                  <img
                    src={photos[currentImg]?.url}
                    alt={`Foto ${currentImg + 1}`}
                  />

                  <div className="counter">
                    {currentImg + 1} / {photos.length}
                  </div>

                  {photos.length > 1 && (
                    <>
                      <button
                        className="arrow left"
                        onClick={goPrev}
                        aria-label="Foto anterior"
                      >
                        ‹
                      </button>
                      <button
                        className="arrow right"
                        onClick={goNext}
                        aria-label="Foto siguiente"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="thumbs">
                    {photos.map((p, i) => (
                      <button
                        key={i}
                        className={`thumb ${i === currentImg ? "active" : ""}`}
                        onClick={() => setCurrentImg(i)}
                        aria-label={`Ver foto ${i + 1}`}
                      >
                        <img src={p.url} alt={`Miniatura ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-gallery">
                Esta propiedad todavía no tiene fotos.
              </div>
            )}
          </div>

          <div className="content">
            <div className="main-info">
              <h1>
                ${property.price?.toLocaleString("es-AR")}
                <span> /mes</span>
              </h1>

              <div className="meta-row">
                {typeLabel && <span className="type-pill">{typeLabel}</span>}
                {location && <span className="location">{location}</span>}
              </div>

              <div className="chips">
                {property.sqm && <span className="chip">{property.sqm} m²</span>}
                {property.furnished && <span className="chip">Amoblado</span>}
                {property.pets_allowed && (
                  <span className="chip">Acepta mascotas</span>
                )}
              </div>

              <div className="divider" />

              <section>
                <h2 className="section-title">Descripción</h2>
                <p className="description">
                  {description || "Todavía no agregaste una descripción."}
                </p>
              </section>

              {videos.length > 0 && (
                <section className="video-section">
                  <h2 className="section-title">Video</h2>
                  {videos.map((v, i) => (
                    <video key={i} className="video" controls>
                      <source src={v.url} />
                    </video>
                  ))}
                </section>
              )}
            </div>

            <aside className="side-card">
              <small>Preview propietario</small>
              <h2>Revisá antes de publicar.</h2>
              <p>
                Esta vista te permite controlar cómo se presenta tu propiedad.
                Después podés publicarla para recibir interesados.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => router.push("/owner")}
              >
                Volver a mis propiedades
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
