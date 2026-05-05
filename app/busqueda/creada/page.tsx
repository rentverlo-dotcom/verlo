"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"

function Confetti() {
  const [pieces, setPieces] = useState<
    { left: number; delay: number; duration: number; size: number; rotate: number }[]
  >([])

  useEffect(() => {
    setPieces(
      Array.from({ length: 42 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.8 + Math.random() * 2,
        size: 7 + Math.random() * 8,
        rotate: Math.random() * 180,
      }))
    )
  }, [])

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: p.size,
            height: p.size * 1.45,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export default function BusquedaCreadaPage() {
  return (
    <main className="success-page">
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

        .success-page {
          position: relative;
          min-height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: 90px 20px 60px;
          background:
            radial-gradient(circle at 14% 16%, rgba(242, 168, 169, 0.52), transparent 28%),
            radial-gradient(circle at 86% 22%, rgba(231, 199, 118, 0.3), transparent 24%),
            radial-gradient(circle at 78% 88%, rgba(116, 190, 220, 0.22), transparent 28%),
            var(--soft);
        }

        .confetti {
          pointer-events: none;
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }

        .confetti span {
          position: absolute;
          top: -24px;
          border-radius: 3px;
          background: var(--pink-dark);
          animation-name: fall;
          animation-timing-function: cubic-bezier(0.16, 0.72, 0.24, 1);
          animation-fill-mode: forwards;
        }

        .confetti span:nth-child(3n) {
          background: var(--yellow);
        }

        .confetti span:nth-child(4n) {
          background: var(--blue);
        }

        .confetti span:nth-child(5n) {
          background: var(--black);
        }

        @keyframes fall {
          0% {
            transform: translateY(-30px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(520deg);
            opacity: 0;
          }
        }

        .card {
          position: relative;
          z-index: 2;
          width: min(100%, 880px);
          border-radius: 48px;
          padding: 56px;
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(5, 0, 2, 0.08);
          box-shadow: 0 28px 80px rgba(5, 0, 2, 0.08);
          text-align: center;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--black);
          text-decoration: none;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.06em;
          line-height: 1;
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

        .badge {
          width: fit-content;
          margin: 34px auto 0;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.66);
          font-size: 13px;
          font-weight: 900;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--pink-dark);
          box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.16);
        }

        h1 {
          margin: 24px auto 0;
          max-width: 760px;
          font-size: clamp(54px, 7vw, 96px);
          line-height: 0.9;
          letter-spacing: -0.085em;
          font-weight: 950;
        }

        h1 em {
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: 400;
        }

        .copy {
          margin: 24px auto 0;
          max-width: 650px;
          color: rgba(5, 0, 2, 0.66);
          font-size: 19px;
          line-height: 1.5;
        }

        .summary {
          margin: 34px auto 0;
          width: min(100%, 590px);
          display: grid;
          gap: 10px;
          padding: 18px;
          border-radius: 26px;
          background: rgba(5, 0, 2, 0.04);
          text-align: left;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          color: rgba(5, 0, 2, 0.62);
          font-size: 14px;
          font-weight: 750;
        }

        .summary-row strong {
          color: var(--black);
          text-align: right;
        }

        .actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 36px;
        }

        .btn {
          min-height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px;
          border-radius: 999px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          text-decoration: none;
          font-size: 16px;
          font-weight: 950;
        }

        .btn-primary {
          background: var(--black);
          color: white;
          box-shadow: 0 18px 45px rgba(5, 0, 2, 0.18);
        }

        .btn-secondary {
          background: white;
          color: var(--black);
        }

        @media (max-width: 640px) {
          .card {
            padding: 34px 24px;
            border-radius: 34px;
          }

          .actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .summary-row {
            flex-direction: column;
            gap: 4px;
          }

          .summary-row strong {
            text-align: left;
          }
        }
      `}</style>

      <Confetti />

      <section className="card">
    <VerloBrand width={104} />

        <div className="badge">
          <span className="dot" />
          Búsqueda creada
        </div>

        <h1>
          Tu búsqueda está <em>activa.</em>
        </h1>

        <p className="copy">
          Ya guardamos tus preferencias. Cuando activemos los cruces, Verlo va a
          poder mostrarte propiedades compatibles y ayudarte a avanzar con
          identidad validada cuando el match tenga sentido.
        </p>

        <div className="summary">
          <div className="summary-row">
            <span>Estado</span>
            <strong>Activa</strong>
          </div>
          <div className="summary-row">
            <span>Qué guardamos</span>
            <strong>Zona, presupuesto y preferencias</strong>
          </div>
          <div className="summary-row">
            <span>Próximo paso</span>
            <strong>Te avisamos cuando haya coincidencias</strong>
          </div>
        </div>

        <div className="actions">
          <Link href="/buscar" className="btn btn-secondary">
            Crear otra búsqueda
          </Link>

          <Link href="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
