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
          background: #ffffff;
          color: #050505;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          overflow-x: hidden;
        }

        .headerWrap {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .header {
          max-width: 1180px;
          margin: 0 auto;
          height: 94px;
          padding: 0 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .logo {
          height: 82px;
          width: auto;
          display: block;
          object-fit: contain;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 24px;
          font-size: 14px;
          font-weight: 900;
        }

        .nav a {
          color: rgba(0, 0, 0, 0.62);
          text-decoration: none;
        }

        .navCta {
          height: 46px;
          padding: 0 22px;
          border-radius: 999px;
          background: #050505;
          color: #ffffff !important;
          display: inline-flex;
          align-items: center;
        }

        .hero {
          max-width: 1180px;
          margin: 0 auto;
          padding: 86px 22px 96px;
          display: grid;
          grid-template-columns: 1fr 430px;
          gap: 64px;
          align-items: center;
        }

        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(37, 211, 102, 0.1);
          border: 1px solid rgba(37, 211, 102, 0.45);
          color: #087c36;
          font-size: 13px;
          font-weight: 950;
          margin-bottom: 24px;
        }

        .eyebrowDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #25d366;
          box-shadow: 0 0 0 7px rgba(37, 211, 102, 0.16);
        }

        h1 {
          margin: 0;
          font-size: clamp(62px, 8vw, 116px);
          line-height: 0.88;
          letter-spacing: -0.085em;
          font-weight: 950;
          max-width: 780px;
        }

        .green {
          color: #25d366;
        }

        .heroText {
          margin: 30px 0 0;
          max-width: 700px;
          font-size: 24px;
          line-height: 1.32;
          letter-spacing: -0.025em;
          color: rgba(0, 0, 0, 0.72);
        }

        .thesisBox {
          margin-top: 30px;
          max-width: 700px;
          padding: 18px 20px;
          border: 2px solid #25d366;
          background: rgba(37, 211, 102, 0.035);
          font-size: 18px;
          line-height: 1.32;
          font-weight: 950;
        }

        .leadCard {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.13);
          border-radius: 32px;
          padding: 30px;
          box-shadow: 0 34px 100px rgba(0, 0, 0, 0.12);
        }

        .leadCard h2 {
          margin: 0;
          font-size: 36px;
          line-height: 0.95;
          letter-spacing: -0.065em;
          font-weight: 950;
        }

        .leadCard p {
          margin: 14px 0 24px;
          font-size: 16px;
          line-height: 1.45;
          color: rgba(0, 0, 0, 0.58);
        }

        form {
          display: grid;
          gap: 12px;
        }

        input,
        select {
          width: 100%;
          height: 54px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          border-radius: 15px;
          background: #ffffff;
          padding: 0 15px;
          outline: none;
          font-size: 15px;
          font-weight: 700;
        }

        input:focus,
        select:focus {
          border-color: #25d366;
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.14);
        }

        .button {
          height: 56px;
          border: 0;
          border-radius: 999px;
          background: #25d366;
          color: #041008;
          font-size: 16px;
          font-weight: 950;
          cursor: pointer;
        }

        .mini {
          margin-top: 14px;
          color: rgba(0, 0, 0, 0.46);
          font-size: 12px;
          line-height: 1.45;
        }

        .success {
          padding: 22px;
          border-radius: 20px;
          border: 2px solid #25d366;
          background: rgba(37, 211, 102, 0.08);
          color: #087c36;
          font-weight: 950;
          line-height: 1.45;
        }

        .section {
          max-width: 1180px;
          margin: 0 auto;
          padding: 92px 22px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }

        .section h2 {
          margin: 0;
          font-size: clamp(50px, 6.4vw, 94px);
          line-height: 0.9;
          letter-spacing: -0.085em;
          font-weight: 950;
        }

        .sectionLead {
          margin: 18px 0 0;
          max-width: 760px;
          font-size: 28px;
          line-height: 1.12;
          letter-spacing: -0.045em;
          color: rgba(0, 0, 0, 0.82);
        }

        .sectionText {
          margin: 24px 0 0;
          max-width: 720px;
          font-size: 21px;
          line-height: 1.38;
          color: rgba(0, 0, 0, 0.68);
        }

        .diagram {
          margin-top: 48px;
          display: grid;
          grid-template-columns: 1fr 90px 1fr 90px 1fr;
          gap: 18px;
          align-items: center;
        }

        .diagramBox {
          min-height: 190px;
          border: 2px solid #050505;
          border-radius: 8px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 20px;
          background: #ffffff;
        }

        .diagramIcon {
          color: #25d366;
          font-size: 58px;
          line-height: 1;
          font-weight: 950;
          margin-bottom: 12px;
        }

        .diagramBox strong {
          display: block;
          font-size: 28px;
          line-height: 0.92;
          letter-spacing: -0.05em;
        }

        .arrow {
          height: 16px;
          background: #25d366;
          position: relative;
          box-shadow: 0 0 20px rgba(37, 211, 102, 0.5);
        }

        .arrow::after {
          content: "";
          position: absolute;
          right: -2px;
          top: 50%;
          transform: translateY(-50%);
          border-left: 28px solid #25d366;
          border-top: 20px solid transparent;
          border-bottom: 20px solid transparent;
        }

        .smallNote {
          margin-top: 28px;
          font-size: 15px;
          color: rgba(0, 0, 0, 0.5);
          font-style: italic;
        }

        .split {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 58px;
          align-items: center;
        }

        .mess {
          min-height: 470px;
          border-radius: 26px;
          position: relative;
          overflow: hidden;
          background: #fbfbfb;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .messWords {
          position: absolute;
          inset: 0;
          padding: 38px;
          color: rgba(0, 0, 0, 0.18);
          font-size: 31px;
          line-height: 1.18;
          font-weight: 950;
          transform: rotate(-8deg) scale(1.08);
        }

        .laser {
          position: absolute;
          top: 52%;
          left: -8%;
          right: -8%;
          height: 7px;
          background: #25d366;
          box-shadow: 0 0 24px rgba(37, 211, 102, 0.75);
        }

        .label {
          margin: 0 0 12px;
          letter-spacing: 0.24em;
          font-size: 13px;
          font-weight: 950;
        }

        .timeline {
          margin-top: 54px;
          height: 2px;
          background: rgba(0, 0, 0, 0.28);
          position: relative;
        }

        .timelinePoint {
          position: absolute;
          left: 72%;
          top: 50%;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: #25d366;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 14px rgba(37, 211, 102, 0.14),
            0 0 0 27px rgba(37, 211, 102, 0.08);
        }

        .timelineCard {
          position: absolute;
          top: 54px;
          left: 58%;
          width: 320px;
          padding: 22px;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.13);
          text-align: center;
        }

        .timelineButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          padding: 0 26px;
          border-radius: 6px;
          background: #25d366;
          color: white;
          font-weight: 950;
        }

        .reputation {
          width: min(430px, 100%);
          aspect-ratio: 1;
          margin: 0 auto;
          border: 9px solid #25d366;
          border-radius: 999px;
          display: grid;
          place-items: center;
          position: relative;
          box-shadow: 0 0 34px rgba(37, 211, 102, 0.22);
        }

        .bigCheck {
          font-size: 116px;
          line-height: 1;
          color: #25d366;
          font-weight: 950;
        }

        .repText {
          position: absolute;
          max-width: 150px;
          font-size: 17px;
          line-height: 1.05;
          font-weight: 850;
        }

        .repTop {
          top: 20px;
          left: 58%;
        }

        .repRight {
          right: -28px;
          top: 42%;
        }

        .repBottom {
          bottom: 18px;
          left: 38%;
        }

        .repLeft {
          left: -28px;
          top: 42%;
        }

        .number {
          margin-top: 24px;
          font-size: clamp(110px, 18vw, 230px);
          line-height: 0.78;
          letter-spacing: -0.09em;
          font-weight: 950;
        }

        .greenLine {
          width: 100%;
          height: 20px;
          background: #25d366;
          margin: 34px 0 26px;
          box-shadow: 0 0 28px rgba(37, 211, 102, 0.34);
        }

        .outlineBox {
          margin-top: 34px;
          border: 2px solid #25d366;
          padding: 22px;
          font-size: 26px;
          line-height: 1.14;
          letter-spacing: -0.04em;
        }

        .stackWrap {
          display: grid;
          place-items: center;
        }

        .stack {
          width: 360px;
          height: 300px;
          position: relative;
        }

        .layer {
          position: absolute;
          left: 50%;
          width: 260px;
          height: 86px;
          transform: translateX(-50%) skewY(-24deg);
          border: 4px solid #050505;
          background: #ffffff;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
        }

        .layer.one {
          top: 30px;
          background: #25d366;
          box-shadow: 0 0 35px rgba(37, 211, 102, 0.55);
        }

        .layer.two {
          top: 105px;
        }

        .layer.three {
          top: 178px;
        }

        .stackLabels {
          display: grid;
          gap: 12px;
          font-size: 18px;
          font-weight: 850;
        }

        .price {
          margin-top: 26px;
          font-size: clamp(78px, 12vw, 155px);
          line-height: 0.86;
          letter-spacing: -0.08em;
          font-weight: 950;
        }

        .compare {
          margin-top: 36px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .risk,
        .solution {
          min-height: 155px;
          display: grid;
          place-items: center;
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.24);
          padding: 24px;
          font-size: 20px;
          line-height: 1.18;
        }

        .solution {
          border: 8px solid #25d366;
          background: rgba(37, 211, 102, 0.04);
          font-weight: 950;
        }

        .vision {
          min-height: 460px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .map {
          position: relative;
          min-height: 390px;
          background-image: radial-gradient(rgba(0, 0, 0, 0.18) 1px, transparent 1px);
          background-size: 12px 12px;
          opacity: 0.7;
          mask-image: radial-gradient(circle at 52% 60%, black 0 55%, transparent 72%);
        }

        .mapGlow {
          position: absolute;
          left: 49%;
          top: 70%;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #25d366;
          box-shadow: 0 0 35px 18px rgba(37, 211, 102, 0.55);
        }

        .footerCta {
          background: #050505;
          color: #ffffff;
          padding: 96px 22px;
        }

        .footerInner {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 54px;
          align-items: center;
        }

        .footerCta h2 {
          margin: 0;
          font-size: clamp(50px, 6vw, 90px);
          line-height: 0.9;
          letter-spacing: -0.085em;
        }

        .footerCta p {
          color: rgba(255, 255, 255, 0.72);
          font-size: 22px;
          line-height: 1.35;
        }

        @media (max-width: 980px) {
          .hero,
          .split,
          .vision,
          .footerInner {
            grid-template-columns: 1fr;
          }

          .diagram {
            grid-template-columns: 1fr;
          }

          .arrow {
            width: 16px;
            height: 64px;
            margin: 0 auto;
          }

          .arrow::after {
            right: auto;
            top: auto;
            bottom: -26px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-top: 28px solid #25d366;
            border-bottom: 0;
          }

          .nav a:not(.navCta) {
            display: none;
          }

          .timeline {
            height: auto;
            min-height: 210px;
          }

          .timelineCard {
            position: relative;
            left: auto;
            top: 60px;
            width: 100%;
          }
        }

        @media (max-width: 620px) {
          .header {
            height: 78px;
          }

          .logo {
            height: 58px;
          }

          .hero {
            padding-top: 54px;
          }

          h1 {
            font-size: 58px;
          }

          .heroText,
          .sectionText,
          .sectionLead {
            font-size: 18px;
          }

          .compare {
            grid-template-columns: 1fr;
          }

          .number {
            font-size: 92px;
          }

          .repRight,
          .repLeft {
            position: static;
            max-width: none;
          }

          .reputation {
            border-radius: 32px;
            height: auto;
            aspect-ratio: auto;
            padding: 32px;
            gap: 14px;
          }
        }
      `}</style>

      <header className="headerWrap">
        <div className="header">
          <img src={logoUrl} alt="Verlo" className="logo" />

          <nav className="nav">
            <a href="#tesis">La tesis</a>
            <a href="#formalizacion">Formalización</a>
            <a href="#acceso" className="navCta">
              Acceso anticipado
            </a>
          </nav>
        </div>
      </header>

      <section className="hero" id="acceso">
        <div>
          <div className="eyebrow">
            <span className="eyebrowDot" />
            Pre-lanzamiento · Testigo digital inmobiliario
          </div>

          <h1>
            Alquilá seguro. <span className="green">Firmá con evidencia.</span>
          </h1>

          <p className="heroText">
            Verlo no es un buscador de propiedades. Es la infraestructura técnica
            que certifica la realidad de una transacción inmobiliaria: identidad,
            acuerdo, contrato y firma.
          </p>

          <div className="thesisBox">
            Nuestro valor fundamental no es la conexión. Es la certificación de la
            verdad técnica.
          </div>
        </div>

        <div className="leadCard">
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
                  <option>Quiero validar identidad de las partes</option>
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

      <section className="section" id="formalizacion">
        <h2>Formalización Directa</h2>
        <p className="sectionLead">
          De la burocracia analógica a un proceso de 5 minutos.
        </p>
        <p className="sectionText">
          Sin intermediarios, sin vueltas. Validamos identidad, estructuramos las
          condiciones y generamos el contrato digital.
        </p>

        <div className="diagram">
          <div className="diagramBox">
            <div>
              <div className="diagramIcon">▣</div>
              <strong>
                Identidad
                <br />
                Validada
              </strong>
            </div>
          </div>

          <div className="arrow" />

          <div className="diagramBox">
            <div>
              <div className="diagramIcon">⇄</div>
              <strong>
                Acuerdo
                <br />
                Estructurado
              </strong>
            </div>
          </div>

          <div className="arrow" />

          <div className="diagramBox">
            <div>
              <div className="diagramIcon">✓</div>
              <strong>
                Contrato
                <br />
                Digital
              </strong>
            </div>
          </div>
        </div>

        <p className="smallNote">
          Reemplaza cláusulas analógicas de reparaciones, fianzas e inhibiciones por
          flujos de validación en tiempo real.
        </p>
      </section>

      <section className="section" id="tesis">
        <div className="split">
          <div className="mess">
            <div className="messWords">
              CONTRATO FIRMA PENDIENTE DOCUMENTOS FALTANTES RETRASO ANALÓGICO
              VERIFICAR NO OFICIAL BORRADOR DUDA ERROR NO VÁLIDO ESPERAR
              CONTRATO FIRMA PENDIENTE DOCUMENTOS FALTANTES RETRASO ANALÓGICO
              VERIFICAR NO OFICIAL BORRADOR DUDA ERROR NO VÁLIDO ESPERAR
            </div>
            <div className="laser" />
          </div>

          <div>
            <p className="label">LA TESIS</p>
            <h2>La verdad transaccional no está certificada.</h2>
            <p className="sectionText">
              La informalidad no está solo en el papel. Está en no poder probar
              quién aceptó qué, cuándo, bajo qué condiciones y con qué identidad.
            </p>
            <div className="thesisBox">
              Verlo actúa como testigo digital de la realidad técnica y legal de lo pactado.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Renovación Inteligente</h2>
        <p className="sectionLead">El débito automático de confianza.</p>
        <p className="sectionText">
          Cercano al vencimiento, la infraestructura activa un flujo de firma sin
          fricción. Las partes con historial positivo evitan volver al mercado.
        </p>

        <div className="timeline">
          <div className="timelinePoint" />
          <div className="timelineCard">
            <span className="timelineButton">Firmar Renovación</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div>
            <h2>El Pasaporte de Reputación</h2>
            <p className="sectionText">
              Cada interacción exitosa queda grabada. Creamos un historial de
              confianza interno y no falsificable.
            </p>
            <p className="sectionText" style={{ fontWeight: 950, color: "#050505" }}>
              A mayor reputación, menor incentivo para operar por fuera de Verlo.
            </p>
          </div>

          <div className="reputation">
            <div className="repText repTop">Contrato exitoso</div>
            <div className="repText repRight">Generación de check positivo</div>
            <div className="repText repBottom">Aumento de reputación inalterable</div>
            <div className="repText repLeft">Barrera de salida activa</div>
            <div className="bigCheck">✓</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="number">3.000.000</div>
        <div className="greenLine" />
        <p className="sectionLead">
          de contratos de vivienda vencen en Argentina entre 2024 y 2027.
        </p>
        <p className="sectionText">
          El muro de vencimientos. Un mercado masivo a punto de colapsar bajo el peso
          de una infraestructura analógica, lenta y costosa.
        </p>
        <div className="outlineBox">
          Verlo es la herramienta diseñada para absorber y procesar este volumen
          masivo de transacciones directas.
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div>
            <h2>El Valor Técnico: El Testigo Digital</h2>
            <p className="sectionText">
              Verlo actúa como custodio de la evidencia y certificador de la realidad
              técnica y legal de lo pactado.
            </p>
          </div>

          <div className="stackWrap">
            <div className="stack">
              <div className="layer one" />
              <div className="layer two" />
              <div className="layer three" />
            </div>
            <div className="stackLabels">
              <span>Firma digital</span>
              <span>Bóveda de evidencia</span>
              <span>Verlo ID</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Monetización Escalable</h2>
        <div className="price">USD 49</div>
        <p className="sectionLead">por parte.</p>
        <p className="sectionText">
          Un fee transaccional por infraestructura de seguridad posicionado como un
          seguro de tranquilidad. Monetizamos la confianza, no las conexiones.
        </p>

        <div className="compare">
          <div className="risk">
            El riesgo.
            <br />
            Contratos nulos, fraude de identidad, disputas sin evidencia.
          </div>

          <div className="solution">
            ✓
            <br />
            La solución.
            <br />
            El Testigo Digital Verlo.
          </div>
        </div>
      </section>

      <section className="section">
        <div className="vision">
          <div>
            <h2>La Visión Global</h2>
            <p className="sectionText">
              Ser el estándar legal y técnico para formalizar cualquier vínculo de
              alquiler en Latinoamérica.
            </p>
            <p className="sectionText" style={{ fontWeight: 950, color: "#050505" }}>
              Verlo: Alquilá seguro. <span className="green">✓</span>
            </p>
          </div>

          <div className="map">
            <div className="mapGlow" />
          </div>
        </div>
      </section>

      <section className="footerCta">
        <div className="footerInner">
          <div>
            <h2>Entrá antes de que abramos la primera versión.</h2>
            <p>
              Si estás por firmar, renovar o formalizar un contrato directo, Verlo
              quiere hablar con vos.
            </p>
          </div>

          <div className="leadCard">
            {!sent ? (
              <>
                <h2>Acceso anticipado</h2>
                <p>Dejanos tus datos y te avisamos cuando abramos.</p>
                <form onSubmit={handleSubmit}>
                  <input required placeholder="Nombre y apellido" />
                  <input required type="email" placeholder="Email" />
                  <input required placeholder="WhatsApp" />
                  <button className="button">Anotarme</button>
                </form>
              </>
            ) : (
              <div className="success">Listo. Quedaste anotado.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
