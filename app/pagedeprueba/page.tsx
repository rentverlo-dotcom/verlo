"use client"

import { FormEvent, useState } from "react"

const logoUrl =
  "https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Image%202026-06-13%20at%2017.10.14.jpeg"

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
          background: #fff;
          color: #050505;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .wrap {
          width: min(760px, calc(100% - 34px));
          margin: 0 auto;
          padding: 42px 0 70px;
        }

        .hero {
          text-align: center;
        }

        .logo {
          width: min(390px, 82vw);
          height: auto;
          display: block;
          margin: 0 auto 12px;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 54px);
          line-height: 1;
          letter-spacing: -0.055em;
          font-weight: 950;
        }

        .saving {
          margin: 8px 0 30px;
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
          font-size: 42px;
          color: #20d466;
          background: white;
          line-height: 1;
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
          margin: 34px auto 28px;
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
          font-size: 44px;
          color: #20d466;
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

        .infoCard {
          margin-top: 30px;
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

        .divider {
          width: 1px;
          height: 100%;
          background: rgba(0, 0, 0, 0.18);
          position: absolute;
          left: 50%;
          top: 0;
        }

        .followBox {
          position: relative;
          padding-left: 28px;
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
          .wrap {
            width: min(100% - 28px, 760px);
            padding-top: 28px;
          }

          .step {
            grid-template-columns: 92px 1fr;
            gap: 16px;
          }

          .icon {
            width: 74px;
            height: 74px;
            font-size: 34px;
          }

          .trust,
          .infoCard,
          .launch {
            grid-template-columns: 1fr;
          }

          .trustItem {
            grid-template-columns: 76px 1fr;
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
      `}</style>

      <div className="wrap">
        <section className="hero">
          <img src={logoUrl} alt="Verlo" className="logo" />

          <h1>Alquilá fácil, rápido y seguro</h1>
          <div className="saving">Ahorrá hasta un 95%</div>

          <div className="steps">
            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 1</span>
                <div className="icon">↗</div>
              </div>
              <div>
                <h3>Invitación</h3>
                <p>Creá un link único para invitar a la otra parte a Verlo.</p>
              </div>
            </div>

            <div className="step">
              <div className="iconWrap">
                <span className="pill">Paso 2</span>
                <div className="icon">☻</div>
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
                <div className="icon">☑</div>
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
                <div className="icon">$</div>
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
                <div className="icon">✎</div>
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
              <div className="trustIcon">✓</div>
              <div>
                <h3>Testigo Digital</h3>
                <p>Registro inalterable de toda la trazabilidad y acuerdos entre partes.</p>
              </div>
            </div>

            <div className="trustItem">
              <div className="trustIcon">✓</div>
              <div>
                <h3>Identidad Verificada</h3>
                <p>Tecnología que confirma quién sos y garantiza acuerdos válidos.</p>
              </div>
            </div>
          </div>
          <div className="videoBlock">
  <video
    className="demoVideo"
    src="https://pub-804525ac911240ab845e611b752528e4.r2.dev/WhatsApp%20Video%202026-06-14%20at%2001.15.23.mp4"
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
            <a className="instagram" href="https://instagram.com" target="_blank">
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
            Quiero acceso anticipado
          </button>
        </section>

        <section className="formCard" id="acceso">
          {!sent ? (
            <>
              <h2>Entrá al acceso anticipado</h2>
              <p>
                Estamos abriendo la primera versión para propietarios, inquilinos y
                operadores que necesiten formalizar contratos directos.
              </p>

              <form onSubmit={handleSubmit}>
                <input required placeholder="Nombre y apellido" />
                <input required type="email" placeholder="Email" />
                <input required placeholder="WhatsApp" />

                <div className="row">
                  <select required defaultValue="">
                    <option value="" disabled>
                      ¿Qué perfil sos?
                    </option>
                    <option>Propietario</option>
                    <option>Inquilino</option>
                    <option>Martillero / gestor</option>
                    <option>Otro</option>
                  </select>

                  <select required defaultValue="">
                    <option value="" disabled>
                      ¿Qué necesitás?
                    </option>
                    <option>Estoy por firmar un contrato</option>
                    <option>Quiero renovar un contrato</option>
                    <option>Quiero validar identidad</option>
                    <option>Solo quiero enterarme</option>
                  </select>
                </div>

                <button className="submit">Quiero acceso anticipado</button>
              </form>

              <div className="mini">
                Los primeros usuarios podrán probar Verlo sin costo durante la etapa
                inicial.
              </div>
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
