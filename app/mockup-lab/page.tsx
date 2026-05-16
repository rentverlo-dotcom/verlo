import { notFound } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type MockupLabPageProps = {
  searchParams: {
    key?: string
  }
}

const MOCKUP_KEY = process.env.MOCKUP_LAB_KEY

export default function MockupLabPage({ searchParams }: MockupLabPageProps) {
  if (!MOCKUP_KEY || searchParams.key !== MOCKUP_KEY) {
    notFound()
  }

  return (
    <main className="mockup-lab">
      <style>{`
        :root {
          --pink: #f2a8a9;
          --pink-dark: #c37986;
          --black: #050002;
          --soft: #f2ebec;
          --blue: #74bedc;
          --yellow: #e7c776;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--soft);
        }

        .mockup-lab {
          min-height: 100vh;
          background:
            radial-gradient(circle at 15% 20%, rgba(242, 168, 169, 0.7), transparent 28%),
            radial-gradient(circle at 85% 18%, rgba(231, 199, 118, 0.45), transparent 24%),
            radial-gradient(circle at 78% 82%, rgba(116, 190, 220, 0.34), transparent 26%),
            var(--soft);
          color: var(--black);
          padding: 40px 24px 80px;
        }

        .lab-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .lab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 44px;
        }

        .lab-tag {
          border: 1px solid rgba(5, 0, 2, 0.1);
          background: rgba(255, 255, 255, 0.55);
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(5, 0, 2, 0.62);
        }

        .hero {
          display: grid;
          grid-template-columns: 0.92fr 1.08fr;
          gap: 44px;
          align-items: center;
        }

        .copy-card {
          border-radius: 42px;
          padding: 44px;
          background: rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(5, 0, 2, 0.08);
        }

        .eyebrow {
          width: fit-content;
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
          margin: 24px 0 0;
          font-size: clamp(48px, 6vw, 88px);
          line-height: 0.9;
          letter-spacing: -0.085em;
          font-weight: 950;
        }

        h1 em {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
          font-style: italic;
        }

        .copy {
          margin: 24px 0 0;
          max-width: 560px;
          font-size: 20px;
          line-height: 1.48;
          color: rgba(5, 0, 2, 0.66);
        }

        .bullets {
          display: grid;
          gap: 12px;
          margin: 30px 0 0;
          padding: 0;
          list-style: none;
        }

        .bullets li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 900;
          color: rgba(5, 0, 2, 0.72);
        }

        .check {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          display: grid;
          place-items: center;
          font-size: 13px;
          flex: 0 0 auto;
        }

        .phone-stage {
          min-height: 680px;
          display: grid;
          place-items: center;
        }

        .phone {
          width: min(390px, 86vw);
          height: 720px;
          border: 10px solid var(--black);
          border-radius: 46px;
          background: #fbf8f5;
          box-shadow: 0 28px 90px rgba(5, 0, 2, 0.24);
          overflow: hidden;
          position: relative;
        }

        .phone-top {
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .dots {
          display: flex;
          gap: 6px;
        }

        .dots span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--black);
        }

        .screen {
          height: calc(100% - 74px);
          padding: 24px;
          display: grid;
          align-content: start;
        }

        .screen-card {
          border-radius: 32px;
          padding: 26px;
          background:
            radial-gradient(circle at 88% 92%, rgba(116, 190, 220, 0.32), transparent 34%),
            rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(5, 0, 2, 0.08);
          min-height: 560px;
        }

        .screen-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 999px;
          background: rgba(242, 168, 169, 0.28);
          color: rgba(5, 0, 2, 0.72);
          font-size: 12px;
          font-weight: 950;
        }

        .screen-title {
          margin: 22px 0 0;
          font-size: 42px;
          line-height: 0.92;
          letter-spacing: -0.07em;
          font-weight: 950;
        }

        .screen-copy {
          margin: 16px 0 0;
          color: rgba(5, 0, 2, 0.62);
          font-size: 15px;
          line-height: 1.45;
        }

        .id-box {
          margin-top: 28px;
          border-radius: 26px;
          background: var(--black);
          color: white;
          padding: 22px;
          display: grid;
          gap: 14px;
        }

        .id-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .id-icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: var(--pink);
          color: var(--black);
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 950;
        }

        .id-row strong {
          display: block;
          font-size: 15px;
        }

        .id-row span {
          display: block;
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.66);
          font-size: 13px;
        }

        .selfie-frame {
          margin-top: 24px;
          height: 210px;
          border-radius: 30px;
          background:
            radial-gradient(circle at 50% 38%, rgba(242, 168, 169, 0.8), transparent 18%),
            radial-gradient(circle at 50% 54%, rgba(5, 0, 2, 0.9), transparent 17%),
            linear-gradient(135deg, #f2ebec, #ffffff);
          border: 1px solid rgba(5, 0, 2, 0.08);
          position: relative;
          overflow: hidden;
        }

        .selfie-frame::after {
          content: "Video selfie";
          position: absolute;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(5, 0, 2, 0.9);
          color: white;
          font-size: 12px;
          font-weight: 950;
        }

        .cta-button {
          margin-top: 26px;
          width: 100%;
          height: 54px;
          border: 0;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 15px;
          font-weight: 950;
        }

        .slide-label {
          margin-top: 26px;
          text-align: center;
          color: rgba(5, 0, 2, 0.48);
          font-size: 13px;
          font-weight: 900;
        }

        @media (max-width: 960px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .phone-stage {
            min-height: auto;
          }
        }
      `}</style>

      <div className="lab-shell">
        <header className="lab-header">
          <VerloBrand width={112} />
          <span className="lab-tag">Mockup privado para anuncios</span>
        </header>

        <section className="hero">
          <div className="copy-card">
            <div className="eyebrow">
              <span className="dot" />
              Verificación segura
            </div>

            <h1>
              Validá tu identidad en <em>Verlo.</em>
            </h1>

            <p className="copy">
              Para avanzar con confianza, Verlo puede pedir documento y video selfie antes de habilitar contacto, visitas o firma digital.
            </p>

            <ul className="bullets">
              <li>
                <span className="check">✓</span>
                Identidad validada antes del contacto real
              </li>
              <li>
                <span className="check">✓</span>
                Menos perfiles falsos
              </li>
              <li>
                <span className="check">✓</span>
                Más seguridad para propietarios e inquilinos
              </li>
            </ul>
          </div>

          <div className="phone-stage">
            <div className="phone">
              <div className="phone-top">
                <VerloBrand width={70} />
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="screen">
                <div className="screen-card">
                  <span className="screen-kicker">
                    <span className="dot" />
                    Paso seguro
                  </span>

                  <h2 className="screen-title">
                    Verificá tu identidad
                  </h2>

                  <p className="screen-copy">
                    Subí tu documento y grabá una video selfie corta. Esto ayuda a que el alquiler directo sea más seguro.
                  </p>

                  <div className="id-box">
                    <div className="id-row">
                      <div className="id-icon">ID</div>
                      <div>
                        <strong>Documento</strong>
                        <span>Frente y dorso legibles</span>
                      </div>
                    </div>

                    <div className="id-row">
                      <div className="id-icon">▶</div>
                      <div>
                        <strong>Video selfie</strong>
                        <span>Confirmamos que sos una persona real</span>
                      </div>
                    </div>
                  </div>

                  <div className="selfie-frame" />

                  <button className="cta-button">
                    Empezar verificación
                  </button>

                  <div className="slide-label">
                    Swipe para ver el siguiente paso →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
