import { notFound } from "next/navigation"
import VerloBrand from "@/components/VerloBrand"

type MockupLabPageProps = {
  searchParams: {
    key?: string
  }
}

const MOCKUP_KEY = process.env.MOCKUP_LAB_KEY

const properties = [
  {
    title: "Almagro, 2 amb.",
    price: "$430.000",
    match: "97% compatible",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Villa Devoto, 3 amb.",
    price: "$520.000",
    match: "94% compatible",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Palermo, 2 amb.",
    price: "$610.000",
    match: "91% compatible",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
  },
]

function SwipeScene() {
  return (
    <div className="scene-inner">
      <div className="phone-label">
        <span className="dot" />
        Matches para vos
      </div>

      <h1 className="phone-title">Elegí con un swipe</h1>

      <div className="card-area">
        {properties.map((property) => (
          <article className="property-card" key={property.title}>
            <div
              className="property-image"
              style={{ backgroundImage: `url(${property.image})` }}
            />

            <div className="stamp">ME GUSTA</div>

            <div className="property-content">
              <h2>{property.title}</h2>

              <div className="property-meta">
                <span>{property.price}</span>
                <strong>{property.match}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="phone-actions">
        <div className="round-action">×</div>
        <div className="round-action like">♥</div>
      </div>
    </div>
  )
}

function DniScene() {
  return (
    <div className="scene-inner">
      <div className="phone-label">
        <span className="dot" />
        Verificación segura
      </div>

      <h1 className="phone-title">Subí tu documento</h1>

      <p className="phone-copy">
        Sacá una foto clara del frente y dorso para validar tu identidad.
      </p>

      <div className="dni-card">
        <div className="dni-top">
          <span>DOCUMENTO</span>
          <strong>VERLO ID</strong>
        </div>

        <div className="dni-body">
          <div className="dni-photo" />
          <div className="dni-lines">
            <span />
            <span />
            <span />
            <span className="short" />
          </div>
        </div>

        <div className="dni-bottom">
          <span>Nombre</span>
          <strong>Persona Validada</strong>
        </div>
      </div>

      <div className="scan-box">
        <div className="scan-corners">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="scan-line" />
        <p>Enfocá el documento</p>
      </div>
    </div>
  )
}

function SelfieScene() {
  return (
    <div className="scene-inner">
      <div className="phone-label">
        <span className="dot" />
        Video selfie
      </div>

      <h1 className="phone-title">Confirmá que sos vos</h1>

      <p className="phone-copy">
        Grabá una selfie corta para avanzar con más seguridad.
      </p>

      <div className="selfie-camera">
        <div className="record-pill">REC</div>
        <div className="face" />
      </div>

      <button className="primary-button">Video selfie enviada</button>
    </div>
  )
}

function ContractScene() {
  return (
    <div className="scene-inner">
      <div className="phone-label">
        <span className="dot" />
        Contrato digital
      </div>

      <h1 className="phone-title">Firmá sin vueltas</h1>

      <p className="phone-copy">
        Cuando hay acuerdo, Verlo ordena los datos y habilita la firma digital.
      </p>

      <div className="contract-card">
        <div className="contract-line wide" />
        <div className="contract-line" />
        <div className="contract-line short" />

        <div className="signature-box">
          <span>Firma digital</span>
          <strong>Verlo</strong>
        </div>

        <div className="contract-check">✓ Contrato listo</div>
      </div>

      <button className="primary-button">Firmar contrato</button>
    </div>
  )
}

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
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 22%, rgba(242, 168, 169, 0.9), transparent 28%),
            radial-gradient(circle at 82% 20%, rgba(231, 199, 118, 0.48), transparent 24%),
            radial-gradient(circle at 80% 82%, rgba(116, 190, 220, 0.42), transparent 28%),
            var(--soft);
          padding: 24px;
        }

        .phone-wrap {
          position: relative;
          width: min(420px, 92vw);
          aspect-ratio: 390 / 760;
        }

        .phone-glow {
          position: absolute;
          inset: -70px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 30% 35%, rgba(242, 168, 169, 0.7), transparent 30%),
            radial-gradient(circle at 78% 78%, rgba(116, 190, 220, 0.5), transparent 26%);
          filter: blur(8px);
          opacity: 0.85;
        }

        .phone {
          position: relative;
          width: 100%;
          height: 100%;
          border: 10px solid var(--black);
          border-radius: 48px;
          background: #fbf8f5;
          box-shadow: 0 30px 90px rgba(5, 0, 2, 0.28);
          overflow: hidden;
        }

        .phone-top {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 26px;
          background: #fbf8f5;
          position: relative;
          z-index: 20;
        }

        .dots {
          display: flex;
          gap: 7px;
        }

        .dots span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--black);
        }

        .screen {
          position: relative;
          height: calc(100% - 76px);
          overflow: hidden;
        }

        .flow-scene {
          position: absolute;
          inset: 0;
          padding: 18px 22px 24px;
          opacity: 0;
          transform: translateX(28px);
          animation-duration: 20s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .scene-swipe {
          animation-name: sceneSwipe;
        }

        .scene-dni {
          animation-name: sceneDni;
        }

        .scene-selfie {
          animation-name: sceneSelfie;
        }

        .scene-contract {
          animation-name: sceneContract;
        }

        .scene-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .phone-label {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 999px;
          background: rgba(242, 168, 169, 0.28);
          color: rgba(5, 0, 2, 0.74);
          font-size: 12px;
          font-weight: 950;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--pink-dark);
          box-shadow: 0 0 0 5px rgba(195, 121, 134, 0.16);
        }

        .phone-title {
          margin: 16px 0 0;
          font-size: 36px;
          line-height: 0.9;
          letter-spacing: -0.075em;
          font-weight: 950;
        }

        .phone-copy {
          margin: 14px 0 0;
          color: rgba(5, 0, 2, 0.62);
          font-size: 15px;
          line-height: 1.42;
        }

        .card-area {
          position: relative;
          flex: 1;
          margin-top: 18px;
          min-height: 0;
        }

        .property-card {
          position: absolute;
          inset: 0;
          border-radius: 32px;
          overflow: hidden;
          background: #ddd;
          box-shadow: 0 22px 60px rgba(5, 0, 2, 0.18);
          transform-origin: 50% 90%;
          opacity: 0;
        }

        .property-card:nth-child(1) {
          animation: swipeOne 5s infinite;
          z-index: 3;
        }

        .property-card:nth-child(2) {
          animation: swipeTwo 5s infinite;
          z-index: 2;
        }

        .property-card:nth-child(3) {
          animation: swipeThree 5s infinite;
          z-index: 1;
        }

        .property-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
        }

        .property-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(5, 0, 2, 0.02) 35%, rgba(5, 0, 2, 0.86));
        }

        .property-content {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 24px;
          z-index: 2;
          color: white;
        }

        .property-content h2 {
          margin: 0;
          font-size: 34px;
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        .property-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
        }

        .property-meta span {
          font-size: 16px;
          font-weight: 950;
        }

        .property-meta strong {
          padding: 8px 10px;
          border-radius: 999px;
          background: var(--pink);
          color: var(--black);
          font-size: 12px;
          font-weight: 950;
        }

        .stamp {
          position: absolute;
          top: 26px;
          right: 22px;
          z-index: 4;
          padding: 10px 13px;
          border: 4px solid var(--pink);
          border-radius: 16px;
          color: var(--pink);
          background: rgba(255, 255, 255, 0.84);
          font-weight: 950;
          font-size: 18px;
          transform: rotate(8deg);
          opacity: 0;
        }

        .property-card:nth-child(1) .stamp {
          animation: stampLike 5s infinite;
        }

        .phone-actions {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-top: 18px;
        }

        .round-action {
          width: 62px;
          height: 62px;
          border-radius: 999px;
          border: 1px solid rgba(5, 0, 2, 0.08);
          background: white;
          display: grid;
          place-items: center;
          font-size: 26px;
          box-shadow: 0 14px 30px rgba(5, 0, 2, 0.08);
          font-weight: 950;
        }

        .round-action.like {
          background: var(--pink);
        }

        .dni-card {
          margin-top: 22px;
          border-radius: 24px;
          background:
            radial-gradient(circle at 88% 18%, rgba(242, 168, 169, 0.55), transparent 24%),
            linear-gradient(135deg, #ffffff, #f2ebec);
          border: 1px solid rgba(5, 0, 2, 0.1);
          padding: 18px;
          box-shadow: 0 18px 40px rgba(5, 0, 2, 0.08);
        }

        .dni-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 950;
          color: rgba(5, 0, 2, 0.55);
          letter-spacing: 0.08em;
        }

        .dni-top strong {
          color: var(--black);
          letter-spacing: 0;
        }

        .dni-body {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 16px;
          align-items: center;
          margin-top: 18px;
        }

        .dni-photo {
          width: 72px;
          height: 86px;
          border-radius: 18px;
          background:
            radial-gradient(circle at 50% 34%, rgba(5, 0, 2, 0.82), transparent 18%),
            radial-gradient(circle at 50% 68%, rgba(5, 0, 2, 0.82), transparent 24%),
            rgba(242, 168, 169, 0.55);
          filter: blur(1px);
        }

        .dni-lines {
          display: grid;
          gap: 10px;
        }

        .dni-lines span {
          display: block;
          height: 11px;
          border-radius: 999px;
          background: rgba(5, 0, 2, 0.16);
        }

        .dni-lines .short {
          width: 62%;
        }

        .dni-bottom {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(5, 0, 2, 0.08);
          display: flex;
          justify-content: space-between;
          gap: 14px;
          font-size: 12px;
          color: rgba(5, 0, 2, 0.55);
        }

        .dni-bottom strong {
          color: var(--black);
        }

        .scan-box {
          position: relative;
          margin-top: 22px;
          flex: 1;
          min-height: 150px;
          border-radius: 26px;
          background: rgba(5, 0, 2, 0.92);
          overflow: hidden;
          display: grid;
          place-items: center;
          color: white;
        }

        .scan-box p {
          position: relative;
          z-index: 3;
          margin: 0;
          font-size: 13px;
          font-weight: 950;
        }

        .scan-corners span {
          position: absolute;
          width: 34px;
          height: 34px;
          border-color: var(--pink);
          border-style: solid;
          z-index: 2;
        }

        .scan-corners span:nth-child(1) {
          top: 18px;
          left: 18px;
          border-width: 4px 0 0 4px;
          border-radius: 10px 0 0 0;
        }

        .scan-corners span:nth-child(2) {
          top: 18px;
          right: 18px;
          border-width: 4px 4px 0 0;
          border-radius: 0 10px 0 0;
        }

        .scan-corners span:nth-child(3) {
          bottom: 18px;
          left: 18px;
          border-width: 0 0 4px 4px;
          border-radius: 0 0 0 10px;
        }

        .scan-corners span:nth-child(4) {
          bottom: 18px;
          right: 18px;
          border-width: 0 4px 4px 0;
          border-radius: 0 0 10px 0;
        }

        .scan-line {
          position: absolute;
          left: 20px;
          right: 20px;
          height: 3px;
          border-radius: 999px;
          background: var(--pink);
          box-shadow: 0 0 22px rgba(242, 168, 169, 0.9);
          animation: scanMove 2.1s infinite ease-in-out;
        }

        .selfie-camera {
          position: relative;
          margin-top: 24px;
          flex: 1;
          min-height: 360px;
          border-radius: 32px;
          background:
            radial-gradient(circle at 50% 34%, rgba(242, 168, 169, 0.9), transparent 16%),
            radial-gradient(circle at 50% 56%, rgba(5, 0, 2, 0.9), transparent 18%),
            linear-gradient(135deg, #ffffff, #f2ebec);
          border: 1px solid rgba(5, 0, 2, 0.08);
          overflow: hidden;
        }

        .selfie-camera::before {
          content: "";
          position: absolute;
          inset: 22px;
          border: 4px solid var(--pink);
          border-radius: 28px;
          opacity: 0.75;
        }

        .face {
          position: absolute;
          left: 50%;
          top: 44%;
          width: 130px;
          height: 170px;
          transform: translate(-50%, -50%);
          border-radius: 999px 999px 80px 80px;
          background:
            radial-gradient(circle at 50% 28%, rgba(5, 0, 2, 0.9), transparent 18%),
            radial-gradient(circle at 50% 74%, rgba(5, 0, 2, 0.9), transparent 28%),
            rgba(242, 168, 169, 0.62);
          filter: blur(0.2px);
        }

        .record-pill {
          position: absolute;
          top: 22px;
          right: 24px;
          z-index: 2;
          padding: 8px 10px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 11px;
          font-weight: 950;
        }

        .record-pill::before {
          content: "";
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 6px;
          border-radius: 999px;
          background: #f24b4b;
        }

        .contract-card {
          margin-top: 24px;
          flex: 1;
          min-height: 360px;
          border-radius: 30px;
          padding: 26px;
          background:
            radial-gradient(circle at 88% 18%, rgba(116, 190, 220, 0.25), transparent 28%),
            white;
          border: 1px solid rgba(5, 0, 2, 0.1);
          box-shadow: 0 18px 40px rgba(5, 0, 2, 0.08);
        }

        .contract-line {
          height: 12px;
          border-radius: 999px;
          background: rgba(5, 0, 2, 0.14);
          margin-bottom: 14px;
        }

        .contract-line.wide {
          width: 100%;
        }

        .contract-line.short {
          width: 58%;
        }

        .signature-box {
          margin-top: 42px;
          border-radius: 24px;
          border: 2px dashed rgba(5, 0, 2, 0.18);
          padding: 22px;
          background: rgba(242, 168, 169, 0.22);
        }

        .signature-box span {
          display: block;
          color: rgba(5, 0, 2, 0.52);
          font-size: 13px;
          font-weight: 900;
        }

        .signature-box strong {
          display: block;
          margin-top: 12px;
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-size: 46px;
          line-height: 1;
        }

        .contract-check {
          margin-top: 28px;
          padding: 12px 14px;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 13px;
          font-weight: 950;
          text-align: center;
        }

        .primary-button {
          margin-top: 18px;
          width: 100%;
          height: 54px;
          border: 0;
          border-radius: 999px;
          background: var(--black);
          color: white;
          font-size: 15px;
          font-weight: 950;
        }

        @keyframes sceneSwipe {
          0%, 23% {
            opacity: 1;
            transform: translateX(0);
          }

          27%, 100% {
            opacity: 0;
            transform: translateX(-28px);
          }
        }

        @keyframes sceneDni {
          0%, 25% {
            opacity: 0;
            transform: translateX(28px);
          }

          29%, 48% {
            opacity: 1;
            transform: translateX(0);
          }

          52%, 100% {
            opacity: 0;
            transform: translateX(-28px);
          }
        }

        @keyframes sceneSelfie {
          0%, 50% {
            opacity: 0;
            transform: translateX(28px);
          }

          54%, 73% {
            opacity: 1;
            transform: translateX(0);
          }

          77%, 100% {
            opacity: 0;
            transform: translateX(-28px);
          }
        }

        @keyframes sceneContract {
          0%, 75% {
            opacity: 0;
            transform: translateX(28px);
          }

          79%, 96% {
            opacity: 1;
            transform: translateX(0);
          }

          100% {
            opacity: 0;
            transform: translateX(-28px);
          }
        }

        @keyframes swipeOne {
          0% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }

          32% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }

          52% {
            opacity: 0;
            transform: translateX(135%) rotate(16deg) scale(0.95);
          }

          100% {
            opacity: 0;
            transform: translateX(135%) rotate(16deg) scale(0.95);
          }
        }

        @keyframes swipeTwo {
          0% {
            opacity: 1;
            transform: translateX(0) rotate(-2deg) scale(0.95);
          }

          45% {
            opacity: 1;
            transform: translateX(0) rotate(-2deg) scale(0.95);
          }

          56% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }

          78% {
            opacity: 0;
            transform: translateX(-135%) rotate(-16deg) scale(0.95);
          }

          100% {
            opacity: 0;
            transform: translateX(-135%) rotate(-16deg) scale(0.95);
          }
        }

        @keyframes swipeThree {
          0% {
            opacity: 1;
            transform: translateX(0) rotate(2deg) scale(0.9);
          }

          62% {
            opacity: 1;
            transform: translateX(0) rotate(2deg) scale(0.9);
          }

          74% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }

          100% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }

        @keyframes stampLike {
          0%, 18% {
            opacity: 0;
            transform: scale(0.8) rotate(8deg);
          }

          24%, 36% {
            opacity: 1;
            transform: scale(1) rotate(8deg);
          }

          52%, 100% {
            opacity: 0;
            transform: scale(0.8) rotate(8deg);
          }
        }

        @keyframes scanMove {
          0% {
            top: 24px;
            opacity: 0.2;
          }

          18% {
            opacity: 1;
          }

          50% {
            top: calc(100% - 28px);
            opacity: 1;
          }

          100% {
            top: 24px;
            opacity: 0.2;
          }
        }
      `}</style>

      <div className="phone-wrap">
        <div className="phone-glow" />

        <div className="phone">
          <div className="phone-top">
            <VerloBrand width={74} />
            <div className="dots">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="screen">
            <div className="flow-scene scene-swipe">
              <SwipeScene />
            </div>

            <div className="flow-scene scene-dni">
              <DniScene />
            </div>

            <div className="flow-scene scene-selfie">
              <SelfieScene />
            </div>

            <div className="flow-scene scene-contract">
              <ContractScene />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
