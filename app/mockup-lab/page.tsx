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
    title: "Palermo, 3 amb.",
    price: "$720.000",
    match: "97% compatible",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
  },
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
    title: "Recoleta, 2 amb.",
    price: "$590.000",
    match: "94% compatible",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Belgrano, 4 amb.",
    price: "$980.000",
    match: "91% compatible",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  },
]

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
            radial-gradient(circle at 15% 20%, rgba(242, 168, 169, 0.72), transparent 28%),
            radial-gradient(circle at 86% 20%, rgba(231, 199, 118, 0.45), transparent 24%),
            radial-gradient(circle at 78% 82%, rgba(116, 190, 220, 0.38), transparent 26%),
            var(--soft);
          color: var(--black);
          padding: 34px 24px 80px;
          overflow: hidden;
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
          background: rgba(255, 255, 255, 0.58);
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 900;
          color: rgba(5, 0, 2, 0.62);
        }

        .hero {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 52px;
          align-items: center;
        }

        .copy-card {
          border-radius: 42px;
          padding: 46px;
          background: rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(5, 0, 2, 0.08);
          box-shadow: 0 24px 80px rgba(5, 0, 2, 0.06);
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
          font-size: clamp(50px, 6.3vw, 92px);
          line-height: 0.88;
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
          min-height: 720px;
          display: grid;
          place-items: center;
          position: relative;
        }

        .phone-stage::before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 30% 35%, rgba(242, 168, 169, 0.9), transparent 25%),
            radial-gradient(circle at 70% 70%, rgba(116, 190, 220, 0.7), transparent 25%);
          filter: blur(2px);
          opacity: 0.75;
        }

        .phone {
          position: relative;
          width: min(390px, 86vw);
          height: 720px;
          border: 10px solid var(--black);
          border-radius: 46px;
          background: #fbf8f5;
          box-shadow: 0 28px 90px rgba(5, 0, 2, 0.24);
          overflow: hidden;
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
          padding: 18px 20px 24px;
          display: flex;
          flex-direction: column;
        }

        .screen-head {
          margin-bottom: 14px;
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
          margin: 14px 0 0;
          font-size: 34px;
          line-height: 0.92;
          letter-spacing: -0.07em;
          font-weight: 950;
        }

        .card-area {
          position: relative;
          flex: 1;
          margin-top: 16px;
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
          animation: swipeOne 7.2s infinite;
          z-index: 3;
        }

        .property-card:nth-child(2) {
          animation: swipeTwo 7.2s infinite;
          z-index: 2;
        }

        .property-card:nth-child(3) {
          animation: swipeThree 7.2s infinite;
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
          background: linear-gradient(to bottom, rgba(5,0,2,0.02) 35%, rgba(5,0,2,0.86));
        }

        .property-content {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 24px;
          z-index: 2;
          color: white;
        }

        .property-content h3 {
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

        .price {
          font-size: 16px;
          font-weight: 950;
        }

        .match {
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
          animation: stampLike 7.2s infinite;
        }

        .actions {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-top: 20px;
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

        @keyframes swipeOne {
          0% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          18% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          32% {
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
          30% {
            opacity: 1;
            transform: translateX(0) rotate(-2deg) scale(0.95);
          }
          34% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          52% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          66% {
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
          64% {
            opacity: 1;
            transform: translateX(0) rotate(2deg) scale(0.9);
          }
          68% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }

        @keyframes stampLike {
          0%, 12% {
            opacity: 0;
            transform: scale(0.8) rotate(8deg);
          }
          16%, 24% {
            opacity: 1;
            transform: scale(1) rotate(8deg);
          }
          32%, 100% {
            opacity: 0;
            transform: scale(0.8) rotate(8deg);
          }
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
              Alquiler directo
            </div>

            <h1>
              Deslizá hasta encontrar tu <em>futura casa.</em>
            </h1>

            <p className="copy">
              En Verlo ves propiedades compatibles, marcás interés y avanzás solo cuando hay match real entre propietario e inquilino.
            </p>

            <ul className="bullets">
              <li>
                <span className="check">✓</span>
                Propiedades compatibles con tu búsqueda
              </li>
              <li>
                <span className="check">✓</span>
                Sin comisión inmobiliaria
              </li>
              <li>
                <span className="check">✓</span>
                Contacto solo cuando hay interés real
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
                <div className="screen-head">
                  <span className="screen-kicker">
                    <span className="dot" />
                    Matches para vos
                  </span>

                  <h2 className="screen-title">
                    Elegí con un swipe
                  </h2>
                </div>

                <div className="card-area">
                  {properties.map((property) => (
                    <article className="property-card" key={property.title}>
                      <div
                        className="property-image"
                        style={{ backgroundImage: `url(${property.image})` }}
                      />

                      <div className="stamp">ME GUSTA</div>

                      <div className="property-content">
                        <h3>{property.title}</h3>

                        <div className="property-meta">
                          <span className="price">{property.price}</span>
                          <span className="match">{property.match}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="actions">
                  <div className="round-action">×</div>
                  <div className="round-action like">♥</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
