"use client"

import { useState } from "react"

const logoUrl =
  "https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Image%202026-06-13%20at%2017.10.14.jpeg"

export default function PaginaDePrueba() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <main className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 18% 18%, rgba(37, 211, 102, 0.18), transparent 28%),
            radial-gradient(circle at 86% 12%, rgba(37, 211, 102, 0.12), transparent 24%),
            linear-gradient(180deg, #ffffff 0%, #f6f8f5 100%);
          color: #050505;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header {
          max-width: 1180px;
          margin: 0 auto;
          padding: 26px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          height: 46px;
          width: auto;
          object-fit: contain;
        }

        .badge {
          padding: 10px 14px;
          border-radius: 999px;
          background: #eafff1;
          color: #087b35;
          border: 1px solid rgba(37, 211, 102, 0.25);
          font-size: 13px;
          font-weight: 900;
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto;
          padding: 70px 22px 90px;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 54px;
          align-items: center;
        }

        .eyebrow {
          display: inline-flex;
          width: fit-content;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(37, 211, 102, 0.12);
          color: #087b35;
          font-weight: 950;
          font-size: 13px;
          margin-bottom: 22px;
        }

        h1 {
          margin: 0;
          font-size: clamp(48px, 7vw, 92px);
          line-height: 0.92;
          letter-spacing: -0.07em;
          max-width: 760px;
        }

        .green {
          color: #25d366;
        }

        .sub {
          margin: 26px 0 0;
          max-width: 650px;
          font-size: 21px;
          line-height: 1.5;
          color: rgba(0, 0, 0, 0.64);
        }

        .proof {
          margin-top: 34px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-width: 720px;
        }

        .proofItem {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.04);
        }

        .proofItem strong {
          display: block;
          font-size: 15px;
          margin-bottom: 6px;
        }

        .proofItem span {
          color: rgba(0, 0, 0, 0.58);
          font-size: 14px;
          line-height: 1.35;
        }

        .card {
          background: #ffffff;
          border-radius: 34px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.1);
          padding: 28px;
        }

        .card h2 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .card p {
          margin: 12px 0 22px;
          color: rgba(0, 0, 0, 0.58);
          line-height: 1.45;
        }

        form {
          display: grid;
          gap: 12px;
        }

        input,
        select {
          width: 100%;
          height: 52px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          padding: 0 15px;
          font-size: 15px;
          outline: none;
          background: #fff;
        }

        input:focus,
        select:focus {
          border-color: #25d366;
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.14);
        }

        .button {
          height: 54px;
          border: 0;
          border-radius: 999px;
          background: #25d366;
          color: #06150b;
          font-size: 16px;
          font-weight: 950;
          cursor: pointer;
          margin-top: 6px;
        }

        .success {
          padding: 18px;
          border-radius: 18px;
          background: #eafff1;
          color: #087b35;
          font-weight: 850;
          line-height: 1.4;
        }

        .mini {
          margin-top: 14px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.46);
          line-height: 1.45;
        }

        .flow {
          margin-top: 44px;
          max-width: 1180px;
          margin-left: auto;
          margin-right: auto;
          padding: 0 22px 80px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .step {
          background: #050505;
          color: white;
          border-radius: 26px;
          padding: 24px;
          min-height: 170px;
        }

        .step:nth-child(2) {
          background: #111;
        }

        .step:nth-child(3) {
          background: #eafff1;
          color: #06150b;
        }

        .step:nth-child(4) {
          background: #25d366;
          color: #06150b;
        }

        .num {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.16);
          font-weight: 950;
          margin-bottom: 28px;
        }

        .step h3 {
          margin: 0;
          font-size: 21px;
          letter-spacing: -0.04em;
        }

        .step p {
          margin: 10px 0 0;
          opacity: 0.72;
          line-height: 1.4;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 42px;
          }

          .proof,
          .flow {
            grid-template-columns: 1fr;
          }

          .badge {
            display: none;
          }
        }
      `}</style>

      <header className="header">
        <img src={logoUrl} alt="Verlo" className="logo" />
        <div className="badge">Pre-lanzamiento</div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Testigo digital para contratos de alquiler</div>

          <h1>
            Firmá tu contrato con <span className="green">respaldo digital.</span>
          </h1>

          <p className="sub">
            Verlo será una plataforma para crear contratos de alquiler, validar identidad de las partes y dejar constancia digital de la firma.
          </p>

          <div className="proof">
            <div className="proofItem">
              <strong>Identidad validada</strong>
              <span>DNI, selfie y datos básicos antes de firmar.</span>
            </div>

            <div className="proofItem">
              <strong>Contrato generado</strong>
              <span>Campos simples para armar el acuerdo.</span>
            </div>

            <div className="proofItem">
              <strong>Constancia digital</strong>
              <span>Evidencia de firma, fecha y trazabilidad.</span>
            </div>
          </div>
        </div>

        <div className="card">
          {!sent ? (
            <>
              <h2>Entrá al acceso anticipado</h2>
              <p>
                Dejanos tus datos y te avisamos cuando abramos la primera versión.
              </p>

              <form onSubmit={handleSubmit}>
                <input required placeholder="Nombre y apellido" />
                <input required type="email" placeholder="Email" />
                <input required placeholder="WhatsApp" />

                <select required defaultValue="">
                  <option value="" disabled>
                    ¿Qué perfil sos?
                  </option>
                  <option>Propietario</option>
                  <option>Inquilino</option>
                  <option>Otro</option>
                </select>

                <select required defaultValue="">
                  <option value="" disabled>
                    ¿En qué etapa estás?
                  </option>
                  <option>Estoy por firmar un contrato</option>
                  <option>Estoy buscando alquilar</option>
                  <option>Tengo una propiedad para alquilar</option>
                  <option>Solo quiero enterarme del lanzamiento</option>
                </select>

                <button className="button">Quiero acceso anticipado</button>
              </form>

              <div className="mini">
                Los primeros usuarios podrán probar Verlo sin costo durante la etapa inicial.
              </div>
            </>
          ) : (
            <div className="success">
              Listo. Quedaste anotado para el acceso anticipado de Verlo.
            </div>
          )}
        </div>
      </section>

      <section className="flow">
        <div className="step">
          <div className="num">1</div>
          <h3>Cargás los datos</h3>
          <p>Propietario, inquilino, inmueble, precio, plazo y condiciones.</p>
        </div>

        <div className="step">
          <div className="num">2</div>
          <h3>Verlo arma el contrato</h3>
          <p>El acuerdo se renderiza en un documento claro y listo para revisión.</p>
        </div>

        <div className="step">
          <div className="num">3</div>
          <h3>Validan identidad</h3>
          <p>Las partes acreditan quiénes son antes de avanzar.</p>
        </div>

        <div className="step">
          <div className="num">4</div>
          <h3>Firma con constancia</h3>
          <p>La firma queda acompañada por evidencia digital.</p>
        </div>
      </section>
    </main>
  )
}
