"use client"

import { FormEvent, useState } from "react"

const logoUrl =
  "https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Image%202026-06-14%20at%2016.35.42.jpeg"

const videoUrl =
  "https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Video%202026-06-14%20at%2001.15.23.mp4"

export default function PaginaDePrueba() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <main className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #ffffff;
          color: #050505;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .siteHeader {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .siteHeaderInner {
          width: min(760px, calc(100% - 34px));
          height: 82px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .headerLogo {
          width: 230px;
          height: auto;
          display: block;
        }

        .wrap {
          width: min(760px, calc(100% - 34px));
          margin: 0 auto;
          padding: 26px 0 70px;
        }

        .hero {
          text-align: center;
          padding: 0 !important;
          margin: 0;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 54px);
          line-height: 1;
          letter-spacing: -0.055em;
          font-weight: 950;
        }

        .saving {
          margin: 8px 0 28px;
          font-size: clamp(24px, 4vw, 36px);
          line-height: 1.05;
          letter-spacing: -0.04em;
          font-weight: 500;
        }

        .steps {
          width: min(520px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 22px;
        }

        .step {
          display: grid;
          grid-template-columns: 116px 1fr;
          gap: 24px;
          align-items: center;
          text-align: left;
        }

        .iconWrap {
          display: grid;
          justify-items: center;
          gap: 8px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 72px;
          height: 26px;
          padding: 0 12px;
          border-radius: 999px;
          background: #20d466;
          color: white;
          font-size: 13px;
          font-weight: 950;
        }

        .icon {
          width: 88px;
          height: 88px;
          border: 3px solid #050505;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: white;
          line-height: 1;
        }

        .icon svg {
          width: 54px;
          height: 54px;
          stroke: #20d466;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .step h3 {
          margin: 0 0 8px;
          font-size: 25px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .step p {
          margin: 0;
          font-size: 15px;
          line-height: 1.25;
          color: rgba(0, 0, 0, 0.74);
          font-weight: 500;
        }

        .trust {
          margin: 36px auto 28px;
          width: min(610px, 100%);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          align-items: center;
        }

        .trustItem {
          display: grid;
          grid-template-columns: 86px 1fr;
          gap: 16px;
          align-items: center;
          text-align: left;
        }

        .trustIcon {
          width: 82px;
          height: 82px;
          border: 4px solid #050505;
          border-radius: 28px;
          display: grid;
          place-items: center;
        }

        .trustIcon svg {
          width: 54px;
          height: 54px;
          stroke: #20d466;
          stroke-width: 3;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .trustItem h3 {
          margin: 0 0 5px;
          font-size: 22px;
          line-height: 0.96;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .trustItem p {
          margin: 0;
          color: rgba(0, 0, 0, 0.62);
          font-size: 13px;
          line-height: 1.25;
          font-weight: 600;
        }

        .videoBlock {
          width: min(620px, 100%);
          margin: 30px auto 0;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #000;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.14);
        }

        .demoVideo {
          width: 100%;
          height: auto;
          display: block;
        }

        .infoCard {
          margin-top: 32px;
          border: 1px solid rgba(0, 0, 0, 0.16);
          border-radius: 18px;
          padding: 28px;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 28px;
          align-items: center;
          background: #fff;
        }

        .infoCard h2 {
          margin: 0 0 12px;
          font-size: 25px;
          line-height: 1.05;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .infoCard p {
          margin: 0;
          font-size: 15px;
          line-height: 1.35;
          color: rgba(0, 0, 0, 0.78);
        }

        .infoCard strong {
          display: block;
          margin-top: 18px;
          font-size: 20px;
          line-height: 1.1;
          letter-spacing: -0.035em;
        }

        .followBox {
          position: relative;
          padding-left: 28px;
        }

        .divider {
          width: 1px;
          height: 100%;
          background: rgba(0, 0, 0, 0.18);
          position: absolute;
          left: 0;
          top: 0;
        }

        .followBox p {
          font-size: 14px;
          font-weight: 750;
        }

        .instagram {
          margin-top: 18px;
          height: 52px;
          border-radius: 13px;
          border: 2px solid #20d466;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 24px;
          color: #050505;
          text-decoration: none;
          font-weight: 950;
        }

        .launch {
          margin-top: 14px;
          border: 2px solid #20d466;
          border-radius: 16px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: 64px 1fr auto;
          gap: 16px;
          align-items: center;
          background: rgba(32, 212, 102, 0.03);
        }

        .rocket {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          background: rgba(32, 212, 102, 0.12);
          display: grid;
          place-items: center;
          font-size: 32px;
        }

        .launch h3 {
          margin: 0 0 5px;
          font-size: 18px;
          letter-spacing: -0.03em;
          line-height: 1.05;
          font-weight: 950;
        }

        .launch p {
          margin: 0;
          font-size: 14px;
          line-height: 1.28;
          color: rgba(0, 0, 0, 0.68);
          font-weight: 600;
        }

        .launchBtn {
          height: 42px;
          padding: 0 22px;
          border-radius: 999px;
          background: #20d466;
          color: white;
          border: 0;
          font-weight: 950;
          white-space: nowrap;
          cursor: pointer;
        }

        .formCard {
          width: min(520px, 100%);
          margin: 14px auto 0;
          border: 1px solid rgba(0, 0, 0, 0.16);
          border-radius: 20px;
          padding: 24px;
          background: #fff;
        }

        .formCard h2 {
          margin: 0;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 950;
        }

        .formCard p {
          margin: 10px 0 18px;
          font-size: 15px;
          line-height: 1.35;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 500;
        }

        form {
          display: grid;
          gap: 9px;
        }

        input,
        select {
          height: 40px;
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.14);
          border-radius: 10px;
          padding: 0 12px;
          font-size: 13px;
          outline: none;
          background: white;
          color: #050505;
        }

        input:focus,
        select:focus {
          border-color: #20d466;
          box-shadow: 0 0 0 3px rgba(32, 212, 102, 0.14);
        }

        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .submit {
          margin-top: 4px;
          height: 48px;
          border: 0;
          border-radius: 999px;
          background: #20d466;
          color: #06140a;
          font-weight: 950;
          cursor: pointer;
        }

        .mini {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.46);
        }

        .success {
          padding: 18px;
          border-radius: 14px;
          border: 2px solid #20d466;
          background: rgba(32, 212, 102, 0.08);
          color: #087b35;
          font-weight: 950;
          line-height: 1.35;
        }

        @media (max-width: 720px) {
          .siteHeaderInner {
            height: 74px;
          }

          .headerLogo {
            width: 180px;
          }

          .wrap {
            width: min(100% - 28px, 760px);
            padding: 22px 0 70px;
          }

          .step {
            grid-template-columns: 92px 1fr;
            gap: 16px;
          }

          .icon {
            width: 74px;
            height: 74px;
          }

          .icon svg {
            width: 45px;
            height: 45px;
          }

          .trust,
          .infoCard,
          .launch {
            grid-template-columns: 1fr;
          }

          .trustItem {
            grid-template-columns: 76px 1fr;
          }

          .trustIcon {
            width: 72px;
            height: 72px;
          }

          .trustIcon svg {
            width: 46px;
            height: 46px;
          }

          .followBox {
            padding-left: 0;
          }

          .divider {
            display: none;
          }

          .launchBtn {
            width: 100%;
          }

          .row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="siteHeader">
        <div className="siteHeaderInner">
          <img src={logoUrl} alt="Verlo" className="headerLogo" />
        </div>
      </header>

      <div className="wrap">
        <section className="hero">
          <h1>Más fácil, rápido y seguro</h1>
          <div className="saving">Ahorrá hasta un 95%</div>

          <div className="steps">
            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 1</span>
                <div className="icon">
                  <svg viewBox="0 0 64 64">
                    <path d="M26 38l12-12" />
                    <path d="M36 18h10v10" />
                    <path d="M38 26l8-8" />
                    <path d="M25 20l-8 8c-5 5-5 13 0 18s13 5 18 0l6-6" />
                    <path d="M39 44l8-8c5-5 5-13 0-18s-13-5-18 0l-6 6" />
                  </svg>
                </div>
              </div>
              <div>
                <h3>Invitación</h3>
                <p>Creá un link único para invitar a la otra parte a Verlo.</p>
              </div>
            </div>

            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 2</span>
                <div className="icon">
                  <svg viewBox="0 0 64 64">
                    <path d="M18 28c0-9 6-16 14-16s14 7 14 16" />
                    <path d="M20 31c0 11 5 19 12 19s12-8 12-19" />
                    <path d="M26 31h.1" />
                    <path d="M38 31h.1" />
                    <path d="M27 40c3 3 7 3 10 0" />
                    <path d="M12 22v-8h8" />
                    <path d="M44 14h8v8" />
                    <path d="M12 42v8h8" />
                    <path d="M44 50h8v-8" />
                    <rect x="40" y="36" width="16" height="16" rx="3" />
                    <path d="M44 36v-4a4 4 0 018 0v4" />
                  </svg>
                </div>
              </div>
              <div>
                <h3>Verlo ID</h3>
                <p>
                  Validación biométrica y video selfie en segundos para garantizar
                  identidad real.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 3</span>
                <div className="icon">
                  <svg viewBox="0 0 64 64">
                    <path d="M18 10h24l8 8v36H18z" />
                    <path d="M42 10v10h10" />
                    <path d="M24 26l4 4 8-9" />
                    <path d="M24 38l4 4 8-9" />
                    <path d="M42 40l10-10 4 4-10 10-6 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3>Acuerdo</h3>
                <p>
                  Cargá condiciones básicas como precio, duración y servicios de forma
                  simple.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 4</span>
                <div className="icon">
                  <svg viewBox="0 0 64 64">
                    <path d="M32 6l22 9v16c0 14-9 22-22 27C19 53 10 45 10 31V15z" />
                    <path d="M32 18v28" />
                    <path d="M40 24c-2-4-14-5-14 2 0 8 16 4 16 13 0 7-13 7-17 2" />
                    <circle cx="48" cy="48" r="10" />
                    <path d="M44 48l3 3 6-7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3>Fee de Seguridad</h3>
                <p>
                  Pago de USD 69 por cada parte para activar la tecnología de Verlo.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 5</span>
                <div className="icon">
                  <svg viewBox="0 0 64 64">
                    <path d="M18 8h28l8 8v40H18z" />
                    <path d="M46 8v10h10" />
                    <path d="M26 44c3-8 7-8 8 0 1 6 6 4 9-1" />
                    <path d="M37 31l13-13 5 5-13 13-8 3z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3>Firma Digital</h3>
                <p>
                  Firmá el contrato digital para cerrar la operación de forma definitiva.
                </p>
              </div>
            </div>
          </div>

          <div className="trust">
            <div className="trustItem">
              <div className="trustIcon">
                <svg viewBox="0 0 64 64">
                  <path d="M32 6l22 9v16c0 14-9 22-22 27C19 53 10 45 10 31V15z" />
                  <path d="M22 32l7 7 14-17" />
                </svg>
              </div>
              <div>
                <h3>Testigo Digital</h3>
                <p>Registro inalterable de toda la trazabilidad y acuerdos entre partes.</p>
              </div>
            </div>

            <div className="trustItem">
              <div className="trustIcon">
                <svg viewBox="0 0 64 64">
                  <circle cx="30" cy="23" r="11" />
                  <path d="M12 54c3-13 11-20 18-20s15 7 18 20" />
                  <circle cx="48" cy="46" r="10" />
                  <path d="M44 46l3 3 6-7" />
                </svg>
              </div>
              <div>
                <h3>Identidad Verificada</h3>
                <p>Tecnología que confirma quién sos y garantiza acuerdos válidos.</p>
              </div>
            </div>
          </div>

          <div className="videoBlock">
            <video
              className="demoVideo"
              src={videoUrl}
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          </div>
        </section>

        <section className="infoCard">
          <div>
            <h2>¡Dejá de regalar miles de dólares en comisiones inmobiliarias!</h2>
            <p>
              Verlo te permite cerrar un nuevo alquiler o renovarlo, con identidad
              validada, firma digital y trazabilidad de punta a punta.
            </p>
            <strong>
              Ahora que conoces Verlo…
              <br />
              ¿Por qué pagarías mucho más, por mucho menos?
            </strong>
          </div>

          <div className="followBox">
            <div className="divider" />
            <p>
              Seguinos en Instagram para convertirte en uno de los miembros fundadores
              de Verlo y enterarte de los beneficios que estamos pensando para vos.
            </p>
            <a className="instagram" href="https://www.instagram.com/verlo_alquileres/" target="_blank">
              ◎ Seguir en Instagram
            </a>
          </div>
        </section>

        <section className="launch">
          <div className="rocket">🚀</div>
          <div>
            <h3>¡Estamos preparando el lanzamiento de Verlo!</h3>
            <p>
              Registrate y accedé primero a la forma más simple y segura de cerrar o
              renovar un alquiler.
            </p>
          </div>
          <button
            className="launchBtn"
            onClick={() =>
              document
                .getElementById("acceso")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
           ¡Quiero cuidar mi dinero!
          </button>
        </section>

        <section className="formCard" id="acceso">
          {!sent ? (
            <>
              <h2>Verlo cambiará el mercado inmobiliario en LATAM</h2>
              <p>
               ¡Sumate! Estamos preparando beneficios especiales para miembros fundadores.
               </p>

              <form onSubmit={handleSubmit}>
                <input required placeholder="Nombre y apellido" />
                <input required type="email" placeholder="Email" />
                <input required placeholder="WhatsApp" />

                <div className="row">
                  <select required defaultValue="">
                    <option value="" disabled>
                      ¿Cómo vas a usar Verlo?
                    </option>
                    <option>Propietario</option>
                    <option>Inquilino</option>
                    <option>Otro</option>
                  </select>

                  <select required defaultValue="">
                    <option value="" disabled>
                      ¿Qué queres hacer?
                    </option>
                    <option>⁠Firmar un nuevo alquiler</option>
                    <option>⁠Renovar un contrato existente</option>
                    <option>Conocer Verlo</option>
                  </select>
                </div>

                <button className="submit">¡Quiero cuidar mi dinero!</button>
              </form>

              {/*<div className="mini">
                Los primeros usuarios podrán probar Verlo sin costo durante la etapa
                inicial.
              </div>*/}
            </>
          ) : (
            <div className="success">
              Listo. Quedaste anotado para el acceso anticipado de Verlo.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
