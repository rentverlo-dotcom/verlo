import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"

export default function OwnerCompletionSuccessPage() {
  return (
    <main className="success-root">
      <style>{styles}</style>

      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 42 }).map((_, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties} />
        ))}
      </div>

      <nav className="nav">
        <div className="container nav-inner">
          <VerloBrand width={34} />

          <div className="nav-links">
            <Link href="/">Inicio</Link>
            <Link href="/propietarios">Propietarios</Link>
            <a href="mailto:hola@verlo.lat">Contacto</a>
          </div>
        </div>
      </nav>

      <section className="success-hero">
        <div className="container success-card">
          <div className="success-mark">✓</div>

          <p className="eyebrow">Propiedad recibida</p>

          <h1>Listo. Ya tenemos la información de tu propiedad.</h1>

          <p>
            Verlo va a revisar la información, las fotos y la compatibilidad con
            búsquedas activas. Si hay avance real, te contactamos para coordinar
            el próximo paso.
          </p>

          <div className="success-grid">
            <article>
              <strong>1</strong>
              <span>Datos guardados</span>
            </article>

            <article>
              <strong>2</strong>
              <span>Fotos y videos recibidos</span>
            </article>

            <article>
              <strong>3</strong>
              <span>Revisión de compatibilidad</span>
            </article>
          </div>

          <div className="actions">
            <Link href="/" className="primary-btn">
              Volver al inicio
            </Link>

            <Link href="/propietarios" className="secondary-btn">
              Ver propietarios
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const styles = `
  .success-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --paper: #fffaf8;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 84% 10%, rgba(242,168,169,.54), transparent 28%),
      radial-gradient(circle at 12% 44%, rgba(195,121,134,.18), transparent 26%),
      var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .success-root * {
    box-sizing: border-box;
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
    background: rgba(242, 235, 236, 0.84);
    border-bottom: 1px solid rgba(5, 0, 2, 0.08);
  }

  .nav-inner {
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
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
    font-weight: 900;
  }

  .success-hero {
    min-height: calc(100vh - 76px);
    display: grid;
    place-items: center;
    padding: 80px 0;
  }

  .success-card {
    position: relative;
    max-width: 880px;
    padding: 54px;
    border-radius: 44px;
    background: rgba(255,255,255,.76);
    border: 1px solid rgba(5,0,2,.08);
    box-shadow: 0 34px 90px rgba(5,0,2,.12);
    text-align: center;
  }

  .success-mark {
    width: 78px;
    height: 78px;
    margin: 0 auto 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--black);
    color: white;
    font-size: 38px;
    font-weight: 950;
    box-shadow: 0 18px 42px rgba(5,0,2,.22);
  }

  .eyebrow {
    margin: 0;
    color: var(--pink-dark);
    text-transform: uppercase;
    letter-spacing: .14em;
    font-size: 12px;
    font-weight: 950;
  }

  h1 {
    margin: 18px auto 0;
    max-width: 760px;
    font-size: clamp(44px, 6.5vw, 82px);
    line-height: .9;
    letter-spacing: -.085em;
  }

  .success-card > p:not(.eyebrow) {
    margin: 24px auto 0;
    max-width: 650px;
    color: rgba(5,0,2,.66);
    font-size: 20px;
    line-height: 1.48;
    font-weight: 650;
  }

  .success-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 34px;
  }

  .success-grid article {
    min-height: 130px;
    padding: 20px;
    border-radius: 28px;
    background: var(--paper);
    border: 1px solid rgba(5,0,2,.08);
    display: grid;
    align-content: center;
    gap: 10px;
  }

  .success-grid strong {
    color: var(--pink-dark);
    font-size: 34px;
    line-height: 1;
    font-weight: 950;
  }

  .success-grid span {
    font-weight: 950;
    line-height: 1.2;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 34px;
  }

  .primary-btn,
  .secondary-btn {
    display: inline-flex;
    min-height: 56px;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 950;
  }

  .primary-btn {
    background: var(--black);
    color: white;
    box-shadow: 0 18px 42px rgba(5,0,2,.18);
  }

  .secondary-btn {
    color: var(--black);
    background: rgba(255,255,255,.62);
    border: 1px solid rgba(5,0,2,.1);
  }

  .confetti {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 5;
  }

  .confetti span {
    --delay: calc((var(--i) % 12) * .12s);
    position: absolute;
    top: -30px;
    left: calc((var(--i) * 37) % 100 * 1%);
    width: 10px;
    height: 18px;
    border-radius: 4px;
    background: var(--pink-dark);
    opacity: .9;
    animation: fall 3.8s var(--delay) ease-in-out infinite;
  }

  .confetti span:nth-child(3n) {
    background: var(--black);
  }

  .confetti span:nth-child(4n) {
    background: var(--pink);
  }

  .confetti span:nth-child(5n) {
    width: 14px;
    height: 14px;
    border-radius: 50%;
  }

  @keyframes fall {
    0% {
      transform: translate3d(0, -40px, 0) rotate(0deg);
      opacity: 0;
    }

    12% {
      opacity: 1;
    }

    100% {
      transform: translate3d(80px, 110vh, 0) rotate(520deg);
      opacity: 0;
    }
  }

  @media (max-width: 900px) {
    .success-card {
      padding: 34px 22px;
      border-radius: 34px;
    }

    .success-grid {
      grid-template-columns: 1fr;
    }
  }
`
