"use client"

import {
  useParams,
  useRouter,
} from "next/navigation"

import VerloBrand from "@/components/VerloBrand"

export default function LegacyMatchPage() {
  const router =
    useRouter()

  const params =
    useParams<{
      token: string
    }>()

  const token =
    String(
      params?.token ||
        ""
    )

  return (
    <>
      <main className="page">
        <section className="card">
          <VerloBrand />

          <div className="badge">
            ENLACE ANTERIOR
          </div>

          <h1>
            Este enlace de match
            <br />
            <em>
              ya no está activo.
            </em>
          </h1>

          <p className="description">
            VERLO ahora reúne todas
            tus propiedades compatibles
            en un único panel seguro.
          </p>

          <div className="info">
            <strong>
              No perdiste tu búsqueda.
            </strong>

            <p>
              Abrí el enlace más reciente
              que recibiste de VERLO para
              entrar a tu panel de matches.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
          >
            Ir a VERLO
          </button>

          {token && (
            <span className="legacy">
              El enlace anterior quedó
              deshabilitado por seguridad.
            </span>
          )}
        </section>
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background:
            #f7f7f2;
        }

        body {
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #171717;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(
                255,
                205,
                224,
                0.65
              ),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 20%,
              rgba(
                193,
                224,
                255,
                0.7
              ),
              transparent 30%
            ),
            #f7f7f2;
        }

        .card {
          width: 100%;
          max-width: 620px;
          padding: 42px;
          border: 1px solid
            rgba(
              0,
              0,
              0,
              0.08
            );
          border-radius: 30px;
          background:
            rgba(
              255,
              255,
              255,
              0.9
            );
          box-shadow:
            0 24px 70px
              rgba(
                0,
                0,
                0,
                0.08
              );
        }

        .badge {
          display: inline-flex;
          margin-top: 34px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #171717;
          color: white;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        h1 {
          margin:
            24px 0 18px;
          font-size:
            clamp(
              38px,
              8vw,
              64px
            );
          line-height: 0.98;
          letter-spacing:
            -0.055em;
        }

        h1 em {
          font-family:
            Georgia,
            serif;
          font-weight: 400;
        }

        .description {
          max-width: 480px;
          margin: 0;
          font-size: 18px;
          line-height: 1.55;
          color: #555;
        }

        .info {
          margin-top: 30px;
          padding: 22px;
          border-radius: 20px;
          background: #f2f2ed;
        }

        .info strong {
          display: block;
          margin-bottom: 8px;
          font-size: 16px;
        }

        .info p {
          margin: 0;
          color: #5b5b57;
          line-height: 1.5;
        }

        button {
          width: 100%;
          margin-top: 28px;
          padding: 17px 22px;
          border: 0;
          border-radius: 999px;
          background: #171717;
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
        }

        button:hover {
          opacity: 0.88;
        }

        .legacy {
          display: block;
          margin-top: 18px;
          text-align: center;
          color: #888;
          font-size: 12px;
        }

        @media (
          max-width: 600px
        ) {
          .card {
            padding:
              30px 22px;
            border-radius: 24px;
          }

          .description {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  )
}
