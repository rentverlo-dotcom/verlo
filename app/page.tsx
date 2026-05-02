"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <main
  style={{
    minHeight: "100vh",
    background: "#f2ebec",
    color: "#050002",
  }}
>
      <style jsx global>{`
        :root {
          --pink: #f2a8a9;
          --pink-dark: #c37986;
          --black: #050002;
          --cream: #efefea;
          --soft: #f2ebec;
          --blue: #74bedc;
          --yellow: #e7c776;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--soft);
          color: var(--black);
        }

        .verlo-page {
          overflow: hidden;
        }

        .container {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(18px);
          background: rgba(242, 235, 236, 0.78);
          border-bottom: 1px solid rgba(5, 0, 2, 0.08);
        }

        .nav-inner {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--black);
          font-weight: 950;
          letter-spacing: -0.05em;
          font-size: 28px;
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
          background: transparent;
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

        .nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
          font-size: 14px;
        }

        .nav-links a {
          color: rgba(5, 0, 2, 0.72);
          text-decoration: none;
          font-weight: 700;
        }

        .nav-cta {
          padding: 10px 18px;
          border-radius: 999px;
          background: var(--black);
          color: white !important;
        }

        .hero {
          position: relative;
          padding: 88px 0 80px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.02fr 0.98fr;
          gap: 64px;
          align-items: center;
        }

        .eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.42);
          font-size: 13px;
          font-weight: 800;
          color: rgba(5, 0, 2, 0.72);
        }

        .hero h1 {
          margin: 22px 0 0;
          font-size: clamp(56px, 8.6vw, 116px);
          line-height: 0.88;
          letter-spacing: -0.085em;
          font-weight: 950;
          max-width: 780px;
        }

        .hero h1 em {
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-weight: 400;
          letter-spacing: -0.075em;
        }

        .hero p {
          margin: 28px 0 0;
          max-width: 620px;
          font-size: 21px;
          line-height: 1.45;
          color: rgba(5, 0, 2, 0.68);
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 54px;
          padding: 0 24px;
          border-radius: 999px;
          border: 1px solid rgba(5, 0, 2, 0.12);
          text-decoration: none;
          font-size: 16px;
          font-weight: 900;
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          cursor: pointer;
        }

        .btn:hover {
          transform: translateY(-2px);
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

        .trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 26px;
        }

        .pill {
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.54);
          border: 1px solid rgba(5, 0, 2, 0.08);
          color: rgba(5, 0, 2, 0.7);
          font-weight: 750;
          font-size: 13px;
        }

        .phone-wrap {
          position: relative;
          min-height: 620px;
          display: grid;
          place-items: center;
        }

        .flower-bg {
          position: absolute;
          inset: 22px 0 0;
          border-radius: 46% 54% 48% 52%;
          background:
            radial-gradient(circle at 25% 28%, rgba(242, 168, 169, 0.95) 0 11%, transparent 12%),
            radial-gradient(circle at 72% 34%, rgba(231, 199, 118, 0.95) 0 10%, transparent 11%),
            radial-gradient(circle at 36% 72%, rgba(195, 121, 134, 0.8) 0 13%, transparent 14%),
            radial-gradient(circle at 75% 76%, rgba(116, 190, 220, 0.75) 0 11%, transparent 12%),
            linear-gradient(135deg, #f7d6d7, #f2ebec);
          filter: saturate(1.05);
        }

        .phone {
          position: relative;
          width: min(340px, 78vw);
          min-height: 610px;
          border-radius: 42px;
          background: #f8f5f1;
          border: 10px solid #050002;
          box-shadow: 0 28px 80px rgba(5, 0, 2, 0.22);
          overflow: hidden;
        }

        .phone-top {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 22px;
          font-size: 12px;
          font-weight: 900;
        }

        .mini-logo {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .mini-mark {
          width: 18px;
          height: 15px;
          position: relative;
        }

        .mini-mark::before,
        .mini-mark::after {
          content: "";
          position: absolute;
          top: 0;
          width: 11px;
          height: 15px;
          border: 3px solid var(--black);
          border-radius: 999px;
        }

        .mini-mark::before {
          left: 0;
        }

        .mini-mark::after {
          right: 0;
        }

        .phone-card {
          margin: 10px 18px 0;
          height: 410px;
          border-radius: 30px;
          overflow: hidden;
          position: relative;
          background:
            linear-gradient(to bottom, rgba(5, 0, 2, 0) 35%, rgba(5, 0, 2, 0.82)),
            url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=900&auto=format&fit=crop");
          background-size: cover;
          background-position: center;
        }

        .phone-card-content {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 18px;
          color: white;
        }

        .phone-card-content h3 {
          margin: 0;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .match-badge {
          width: fit-content;
          margin-top: 10px;
          padding: 8px 10px;
          border-radius: 999px;
          background: var(--pink);
          color: var(--black);
          font-size: 12px;
          font-weight: 950;
        }

        .phone-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 22px;
        }

        .round-action {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          border: 1px solid rgba(5, 0, 2, 0.08);
          background: white;
          display: grid;
          place-items: center;
          font-size: 24px;
          box-shadow: 0 14px 30px rgba(5, 0, 2, 0.08);
        }

        .round-action.like {
          background: var(--pink);
        }

        .section {
          padding: 92px 0;
        }

        .section-header {
          max-width: 760px;
          margin-bottom: 42px;
        }

        .kicker {
          margin: 0 0 14px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 12px;
          font-weight: 950;
          color: var(--pink-dark);
        }

        .section-title {
          margin: 0;
          font-size: clamp(40px, 5.5vw, 76px);
          line-height: 0.95;
          letter-spacing: -0.075em;
          font-weight: 950;
        }

        .section-title em {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          font-style: italic;
        }

        .section-copy {
          margin: 18px 0 0;
          font-size: 19px;
          line-height: 1.55;
          color: rgba(5, 0, 2, 0.68);
        }

        .split-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px;
        }

        .role-card {
          padding: 34px;
          border-radius: 34px;
          background: rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(5, 0, 2, 0.08);
          min-height: 360px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .role-card::after {
          content: "";
          position: absolute;
          right: -80px;
          top: -80px;
          width: 210px;
          height: 210px;
          border-radius: 999px;
          background: rgba(242, 168, 169, 0.42);
        }

        .role-card.blue::after {
          background: rgba(116, 190, 220, 0.34);
        }

        .role-card h3 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .role-card p {
          margin: 16px 0 0;
          font-size: 17px;
          line-height: 1.45;
          color: rgba(5, 0, 2, 0.68);
          max-width: 430px;
        }

        .role-list {
          display: grid;
          gap: 10px;
          margin: 26px 0 0;
          padding: 0;
          list-style: none;
        }

        .role-list li {
          font-size: 15px;
          font-weight: 800;
          color: rgba(5, 0, 2, 0.76);
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .step {
          padding: 28px;
          border-radius: 30px;
          background: var(--black);
          color: white;
          min-height: 255px;
          position: relative;
        }

        .step:nth-child(2) {
          background: var(--pink-dark);
        }

        .step:nth-child(3) {
          background: #fff;
          color: var(--black);
        }

        .step:nth-child(4) {
          background: var(--pink);
          color: var(--black);
        }

        .step-number {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.18);
          font-weight: 950;
          margin-bottom: 42px;
        }

        .step:nth-child(3) .step-number,
        .step:nth-child(4) .step-number {
          background: rgba(5, 0, 2, 0.1);
        }

        .step h3 {
          margin: 0;
          font-size: 24px;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .step p {
          margin: 14px 0 0;
          line-height: 1.45;
          opacity: 0.78;
        }

        .proof {
          border-radius: 42px;
          background: #050002;
          color: white;
          padding: 64px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          align-items: center;
        }

        .proof h2 {
          margin: 0;
          font-size: clamp(42px, 5vw, 76px);
          line-height: 0.95;
          letter-spacing: -0.075em;
        }

        .proof p {
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 18px;
          line-height: 1.55;
        }

        .proof-grid {
          display: grid;
          gap: 14px;
        }

        .proof-item {
          padding: 18px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .proof-item strong {
          display: block;
          font-size: 18px;
          margin-bottom: 6px;
        }

        .cta {
          text-align: center;
          padding: 110px 0 120px;
        }

        .cta-card {
          border-radius: 48px;
          padding: 70px 36px;
          background:
            radial-gradient(circle at 20% 30%, rgba(242, 168, 169, 0.78), transparent 30%),
            radial-gradient(circle at 78% 35%, rgba(231, 199, 118, 0.55), transparent 26%),
            rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(5, 0, 2, 0.08);
        }

        .cta h2 {
          margin: 0 auto;
          max-width: 820px;
          font-size: clamp(46px, 6vw, 88px);
          line-height: 0.92;
          letter-spacing: -0.08em;
        }

        .cta p {
          margin: 22px auto 0;
          max-width: 620px;
          color: rgba(5, 0, 2, 0.68);
          font-size: 19px;
          line-height: 1.5;
        }

        .footer {
          padding: 42px 0;
          border-top: 1px solid rgba(5, 0, 2, 0.1);
        }

        .footer-inner {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: center;
          color: rgba(5, 0, 2, 0.58);
          font-size: 14px;
        }

        .footer a {
          color: rgba(5, 0, 2, 0.7);
          text-decoration: none;
          font-weight: 800;
        }

        @media (max-width: 980px) {
          .hero-grid,
          .proof {
            grid-template-columns: 1fr;
          }

          .phone-wrap {
            min-height: 560px;
          }

          .steps {
            grid-template-columns: repeat(2, 1fr);
          }

          .split-cards {
            grid-template-columns: 1fr;
          }

          .nav-links a:not(.nav-cta) {
            display: none;
          }
        }

        @media (max-width: 620px) {
          .container {
            width: min(100% - 28px, 1160px);
          }

          .nav-inner {
            height: 66px;
          }

          .brand {
            font-size: 24px;
          }

          .hero {
            padding: 58px 0 54px;
          }

          .hero p {
            font-size: 18px;
          }

          .hero-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .phone {
            width: 300px;
            min-height: 545px;
          }

          .phone-card {
            height: 360px;
          }

          .steps {
            grid-template-columns: 1fr;
          }

          .proof {
            padding: 34px;
            border-radius: 32px;
          }

          .footer-inner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="verlo-page">
        <header className="nav">
          <div className="container nav-inner">
            <Link href="/" className="brand" aria-label="Verlo">
              verlo
              <span className="mark" aria-hidden="true">
                <span />
              </span>
            </Link>

            <nav className="nav-links">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#seguridad">Seguridad</a>
              <a href="#sumate" className="nav-cta">
                Sumate
              </a>
            </nav>
          </div>
        </header>

        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">
                Alquiler directo entre personas reales
              </div>

              <h1>
                Matcheá con tu <em>futura casa.</em>
              </h1>

              <p>
                Verlo conecta propietarios e inquilinos compatibles para coordinar visitas,
                acordar condiciones y firmar un contrato digital con identidad validada.
              </p>

             <div className="hero-actions">
  <Link className="btn btn-primary" href="/propietario/publicar-v2">
    Publicar mi propiedad
  </Link>

  <Link className="btn btn-secondary" href="/buscar">
    Busco alquilar
  </Link>
</div>

              <div className="trust-row">
                <span className="pill">Sin inmobiliarias</span>
                <span className="pill">Identidad validada</span>
                <span className="pill">Contrato digital</span>
              </div>
            </div>

            <div className="phone-wrap" aria-hidden="true">
              <div className="flower-bg" />
              <div className="phone">
                <div className="phone-top">
                  <span className="mini-logo">
                    verlo <span className="mini-mark" />
                  </span>
                  <span>● ● ●</span>
                </div>

                <div className="phone-card">
                  <div className="phone-card-content">
                    <h3>Palermo, 3 amb.</h3>
                    <div className="match-badge">97% compatible</div>
                  </div>
                </div>

                <div className="phone-actions">
                  <div className="round-action">×</div>
                  <div className="round-action like">♥</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="sumate">
          <div className="container">
            <div className="section-header">
              <p className="kicker">Validación inicial</p>
              <h2 className="section-title">
                Sumate al primer grupo de <em>Verlo.</em>
              </h2>
              <p className="section-copy">
                Estamos reuniendo propietarios e inquilinos para validar la primera red
                de alquiler directo, sin intermediarios y con contrato digital.
              </p>
            </div>

            <div className="split-cards">
              <div className="role-card">
                <div>
                  <h3>Soy propietario</h3>
                  <p>
                    Publicá tu propiedad, recibí inquilinos compatibles y avanzá solo
                    cuando haya una señal real.
                  </p>

                  <ul className="role-list">
                    <li>✓ Cargá tu propiedad gratis</li>
                    <li>✓ Recibí interesados compatibles</li>
                    <li>✓ Coordiná visitas dentro del flujo</li>
                  </ul>
                </div>

              <div style={{ marginTop: 28 }}>
  <Link className="btn btn-primary" href="/propietario/publicar-v2">
    Publicar propiedad
  </Link>
</div>
              </div>

              <div className="role-card blue">
                <div>
                  <h3>Soy inquilino</h3>
                  <p>
                    Contanos qué buscás y entrá a la lista para recibir propiedades
                    compatibles cuando abramos la prueba.
                  </p>

                  <ul className="role-list">
                    <li>✓ Buscá por zona y presupuesto</li>
                    <li>✓ Matcheá con propiedades reales</li>
                    <li>✓ Firmá con más seguridad</li>
                  </ul>
                </div>

                <div style={{ marginTop: 28 }}>
                  <href="/buscar">
                    Quiero alquilar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="container">
            <div className="section-header">
              <p className="kicker">Cómo funciona</p>
              <h2 className="section-title">
                Del like al contrato, <em>sin vueltas.</em>
              </h2>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Cargan su perfil</h3>
                <p>
                  Propietarios publican. Inquilinos cuentan qué buscan, dónde y con qué presupuesto.
                </p>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <h3>Hay match</h3>
                <p>
                  Cuando ambas partes muestran interés, Verlo habilita el siguiente paso.
                </p>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <h3>Visita y acuerdo</h3>
                <p>
                  Coordinan visita, conversan condiciones y dejan asentados los términos importantes.
                </p>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <h3>Firma digital</h3>
                <p>
                  Con la información completa, se genera el contrato y ambas partes firman.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="seguridad">
          <div className="container">
            <div className="proof">
              <div>
                <p className="kicker">Confianza</p>
                <h2>Más simple que una inmobiliaria. Más seguro que arreglar solo.</h2>
                <p>
                  Verlo no desbloquea el contacto real sin validar identidad. El contrato se
                  construye con la información que cada parte carga durante el proceso.
                </p>
              </div>

              <div className="proof-grid">
                <div className="proof-item">
                  <strong>Identidad validada</strong>
                  <span>Antes de avanzar a contacto, visita o firma.</span>
                </div>

                <div className="proof-item">
                  <strong>Información estructurada</strong>
                  <span>Precio, depósito, duración y condiciones quedan claros.</span>
                </div>

                <div className="proof-item">
                  <strong>Contrato digital</strong>
                  <span>La firma ocurre cuando ambas partes ya cerraron el acuerdo.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="container">
            <div className="cta-card">
              <h2>El alquiler directo también puede sentirse bien.</h2>
              <p>
                Sumate a Verlo y ayudanos a validar una forma más simple, segura y humana
                de alquilar.
              </p>

              <div className="hero-actions" style={{ justifyContent: "center" }}>
                <href="/propietario/publicar-v2">
                  Publicar propiedad
                </Link>
                <href="/buscar">
                  Busco alquilar
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container footer-inner">
            <Link href="/" className="brand" aria-label="Verlo">
              verlo
              <span className="mark" aria-hidden="true">
                <span />
              </span>
            </Link>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <Link href="/terminos">Términos</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/contacto">Contacto</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
