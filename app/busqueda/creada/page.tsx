"use client"

import Link from "next/link"

export default function BusquedaCreadaPage() {
  return (
    <main className="created-page">
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

        .created-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 90px 20px 60px;
          background:
            radial-gradient(circle at 14% 16%, rgba(242, 168, 169, 0.52), transparent 28%),
            radial-gradient(circle at 86% 22%, rgba(231, 199, 118, 0.3), transparent 24%),
            radial-gradient(circle at 78% 88%, rgba(116, 190, 220, 0.22), transparent 28%),
            var(--soft);
        }

        .card {
          width: min(100%, 860px);
          border-radius: 46px;
          padding: 52px;
          background: rgba(255, 255, 255, 0.74);
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
          max-width: 720px;
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
          max-width: 620px;
          color: rgba(5, 0, 2, 0.66);
          font-size: 19px;
          line-height: 1.5;
        }

        .summary {
          margin: 34px auto 0;
          width: min(100%, 560px);
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
            padding: 32px 24px;
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

      <section className="card">
        <Link href="/" className="brand" aria-label="Verlo">
          verlo
          <span className="mark" aria-hidden="true">
            <span />
          </span>
        </Link>

        <div className="badge">
          <span className="dot" />
          Búsqueda creada
        </div>

        <h1>
          Tu búsqueda está <em>activa.</em>
        </h1>

        <p className="copy">
          Ya guardamos tus preferencias. A partir de ahora Verlo puede cruzarte
          con propiedades compatibles y ayudarte a avanzar cuando haya match.
        </p>

        <div className="summary">
          <div className="summary-row">
            <span>Estado</span>
            <strong>Activa</strong>
          </div>
          <div className="summary-row">
            <span>Próximo paso</span>
            <strong>Ver propiedades compatibles</strong>
          </div>
          <div className="summary-row">
            <span>Contacto real</span>
            <strong>Después de identidad validada</strong>
          </div>
        </div>

        <div className="actions">
          <Link href="/buscar" className="btn btn-secondary">
            Crear otra búsqueda
          </Link>

          <Link href="/propiedades" className="btn btn-primary">
            Ver propiedades disponibles
          </Link>
        </div>
      </section>
    </main>
  )
}
