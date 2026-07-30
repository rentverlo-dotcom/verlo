"use client"

import { useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type Screen = "home" | "matches" | "property" | "chat" | "renewal" | "profile"

const screens: { id: Screen; label: string }[] = [
  { id: "home", label: "Inicio" },
  { id: "matches", label: "Matches" },
  { id: "property", label: "Ficha" },
  { id: "chat", label: "Chat" },
  { id: "renewal", label: "Renovar" },
  { id: "profile", label: "Perfil" },
]

const styles = `
  .demo-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;
    min-height: 100vh;
    background:
      radial-gradient(circle at 82% 18%, rgba(242, 168, 169, 0.48), transparent 28%),
      radial-gradient(circle at 18% 18%, rgba(116, 190, 220, 0.22), transparent 24%),
      radial-gradient(circle at 48% 86%, rgba(231, 199, 118, 0.18), transparent 22%),
      var(--soft);
    color: var(--black);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    overflow-x: hidden;
  }

  .demo-root * {
    box-sizing: border-box;
  }

  .demo-shell {
    min-height: 100vh;
    width: min(1280px, calc(100% - 40px));
    margin: 0 auto;
    display: grid;
    grid-template-columns: 260px 1fr 260px;
    gap: 30px;
    align-items: center;
    padding: 28px 0;
  }

  .side-panel {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 24px;
  }

  .brand-card,
  .note-card,
  .flow-card {
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 22px 60px rgba(5, 0, 2, 0.07);
    backdrop-filter: blur(18px);
  }

  .brand-card {
    padding: 24px;
  }

  .brand-card p {
    margin: 18px 0 0;
    color: rgba(5, 0, 2, 0.62);
    font-size: 14px;
    line-height: 1.45;
    font-weight: 750;
  }

  .note-card {
    padding: 22px;
  }

  .note-card span {
    display: inline-flex;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.22);
    color: #8f4e5b;
    font-size: 12px;
    font-weight: 950;
  }

  .note-card h1 {
    margin: 18px 0 0;
    font-size: 34px;
    line-height: 0.94;
    letter-spacing: -0.07em;
    font-weight: 950;
  }

  .note-card p {
    margin: 14px 0 0;
    color: rgba(5, 0, 2, 0.62);
    font-size: 14px;
    line-height: 1.5;
  }

  .flow-card {
    padding: 18px;
  }

  .flow-card h2 {
    margin: 0 0 14px;
    color: rgba(5, 0, 2, 0.48);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 950;
  }

  .screen-tabs {
    display: grid;
    gap: 9px;
  }

  .screen-tab {
    min-height: 46px;
    border: 1px solid rgba(5, 0, 2, 0.08);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.58);
    color: rgba(5, 0, 2, 0.62);
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
    text-align: left;
    padding: 0 16px;
  }

  .screen-tab.active {
    background: var(--black);
    color: white;
  }

  .stage {
    display: grid;
    place-items: center;
    position: relative;
    min-height: 760px;
  }

  .glow {
    position: absolute;
    width: 720px;
    height: 720px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 35% 30%, rgba(242, 168, 169, 0.7), transparent 30%),
      radial-gradient(circle at 70% 70%, rgba(116, 190, 220, 0.42), transparent 28%),
      radial-gradient(circle at 72% 24%, rgba(231, 199, 118, 0.32), transparent 24%);
    filter: blur(14px);
    opacity: 0.9;
  }

  .phone {
    width: 410px;
    height: 780px;
    border: 11px solid var(--black);
    border-radius: 56px;
    background: #fffaf9;
    overflow: hidden;
    position: relative;
    box-shadow: 0 40px 110px rgba(5, 0, 2, 0.34);
    z-index: 2;
  }

  .phone::before {
    content: "";
    position: absolute;
    top: 13px;
    left: 50%;
    transform: translateX(-50%);
    width: 118px;
    height: 30px;
    background: var(--black);
    border-radius: 999px;
    z-index: 5;
  }

  .screen {
    min-height: 100%;
    padding: 58px 22px 20px;
    background:
      radial-gradient(circle at 85% 4%, rgba(242, 168, 169, 0.28), transparent 24%),
      #fffaf9;
  }

  .app-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 22px;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background:
      linear-gradient(135deg, rgba(242, 168, 169, 0.8), rgba(116, 190, 220, 0.48));
    border: 2px solid white;
    box-shadow: 0 8px 22px rgba(5, 0, 2, 0.12);
  }

  .icon-btn {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.08);
    background: white;
    display: grid;
    place-items: center;
    font-weight: 950;
  }

  .app-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(242, 168, 169, 0.24);
    color: #8f4e5b;
    font-size: 12px;
    font-weight: 950;
  }

  .app-kicker::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--pink-dark);
  }

  .app-title {
    margin: 16px 0 0;
    font-size: 34px;
    line-height: 0.95;
    letter-spacing: -0.075em;
    font-weight: 950;
  }

  .app-copy {
    margin: 10px 0 0;
    color: rgba(5, 0, 2, 0.58);
    font-size: 14px;
    line-height: 1.45;
  }

  .choice-grid {
    display: grid;
    gap: 12px;
    margin-top: 24px;
  }

  .choice-card {
    border: 1px solid rgba(5, 0, 2, 0.08);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.78);
    padding: 17px;
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 13px;
    align-items: center;
    box-shadow: 0 12px 30px rgba(5, 0, 2, 0.06);
  }

  .choice-icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    background: rgba(242, 168, 169, 0.24);
    display: grid;
    place-items: center;
    color: #8f4e5b;
    font-weight: 950;
  }

  .choice-card h3 {
    margin: 0;
    font-size: 17px;
    letter-spacing: -0.035em;
  }

  .choice-card p {
    margin: 4px 0 0;
    color: rgba(5, 0, 2, 0.56);
    font-size: 12px;
    line-height: 1.35;
  }

  .property-card {
    margin-top: 22px;
    border-radius: 30px;
    overflow: hidden;
    background: white;
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 22px 50px rgba(5, 0, 2, 0.11);
  }

  .property-image {
    height: 240px;
    background:
      linear-gradient(180deg, transparent 48%, rgba(5,0,2,0.5)),
      url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80");
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .badge {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.86);
    color: rgba(5, 0, 2, 0.72);
    font-size: 12px;
    font-weight: 950;
  }

  .property-body {
    padding: 18px;
  }

  .property-body h3 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.05em;
  }

  .muted {
    color: rgba(5, 0, 2, 0.56);
  }

  .price {
    margin-top: 12px;
    font-size: 22px;
    font-weight: 950;
    letter-spacing: -0.045em;
  }

  .swipe-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .round-action {
    min-height: 58px;
    border-radius: 999px;
    border: 1px solid rgba(5, 0, 2, 0.08);
    background: rgba(242, 168, 169, 0.2);
    font-size: 24px;
    font-weight: 950;
  }

  .round-action.dark {
    background: var(--black);
    color: white;
  }

  .detail-image {
    height: 205px;
    border-radius: 28px;
    background:
      linear-gradient(180deg, transparent 42%, rgba(5,0,2,0.48)),
      url("https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=900&q=80");
    background-size: cover;
    background-position: center;
    margin-top: 18px;
    position: relative;
    overflow: hidden;
  }

  .detail-card {
    padding: 15px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(5, 0, 2, 0.08);
    margin-top: 12px;
  }

  .detail-card h3 {
    margin: 0;
    font-size: 16px;
    letter-spacing: -0.035em;
  }

  .detail-card p {
    margin: 7px 0 0;
    color: rgba(5, 0, 2, 0.58);
    font-size: 12px;
    line-height: 1.45;
  }

  .cta-app {
    width: 100%;
    min-height: 56px;
    border-radius: 999px;
    border: 0;
    margin-top: 14px;
    background: var(--black);
    color: white;
    font-size: 15px;
    font-weight: 950;
  }

  .secure-banner {
    margin-top: 16px;
    padding: 14px;
    border-radius: 20px;
    background: rgba(242, 168, 169, 0.22);
    color: #7f4350;
    font-size: 13px;
    line-height: 1.35;
    font-weight: 850;
  }

  .chat-list {
    display: grid;
    gap: 11px;
    margin-top: 18px;
  }

  .bubble {
    max-width: 82%;
    padding: 13px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.35;
  }

  .bubble.me {
    justify-self: end;
    background: rgba(242, 168, 169, 0.24);
  }

  .bubble.other {
    justify-self: start;
    background: rgba(5, 0, 2, 0.06);
  }

  .message-box {
    position: absolute;
    left: 22px;
    right: 22px;
    bottom: 20px;
    height: 52px;
    border-radius: 999px;
    background: white;
    border: 1px solid rgba(5, 0, 2, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 9px 0 17px;
    color: rgba(5, 0, 2, 0.42);
    font-size: 13px;
  }

  .send {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: var(--black);
    color: white;
    display: grid;
    place-items: center;
    font-weight: 950;
  }

  .timeline {
    display: grid;
    gap: 14px;
    margin-top: 22px;
  }

  .timeline-row {
    display: grid;
    grid-template-columns: 34px 1fr;
    gap: 12px;
  }

  .timeline-dot {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: var(--black);
    color: white;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 950;
  }

  .timeline-box {
    padding: 15px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(5, 0, 2, 0.08);
  }

  .timeline-box h3 {
    margin: 0;
    font-size: 16px;
    letter-spacing: -0.035em;
  }

  .timeline-box p {
    margin: 6px 0 0;
    color: rgba(5, 0, 2, 0.58);
    font-size: 12px;
    line-height: 1.4;
  }

  .profile-card {
    margin-top: 20px;
    padding: 20px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(5, 0, 2, 0.08);
    text-align: center;
  }

  .profile-avatar {
    width: 86px;
    height: 86px;
    border-radius: 999px;
    background:
      linear-gradient(135deg, rgba(242, 168, 169, 0.86), rgba(116, 190, 220, 0.48));
    border: 4px solid white;
    margin: 0 auto 14px;
    box-shadow: 0 18px 40px rgba(5, 0, 2, 0.12);
  }

  .profile-card h3 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.045em;
  }

  .check-list {
    display: grid;
    gap: 10px;
    margin-top: 18px;
    text-align: left;
  }

  .check-row {
    padding: 13px;
    border-radius: 18px;
    background: rgba(5, 0, 2, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    font-weight: 850;
  }

  .status-ok {
    color: #32785f;
  }

  .status-pending {
    color: #9a6a21;
  }

  .right-panel {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
  }

  .mini-stat {
    padding: 18px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(5, 0, 2, 0.08);
    box-shadow: 0 18px 50px rgba(5, 0, 2, 0.06);
  }

  .mini-stat strong {
    display: block;
    font-size: 28px;
    letter-spacing: -0.06em;
  }

  .mini-stat span {
    display: block;
    margin-top: 4px;
    color: rgba(5, 0, 2, 0.56);
    font-size: 13px;
    font-weight: 800;
    line-height: 1.35;
  }

  .bottom-nav {
    position: absolute;
    left: 22px;
    right: 22px;
    bottom: 20px;
    height: 58px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(5, 0, 2, 0.08);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
    box-shadow: 0 12px 34px rgba(5, 0, 2, 0.08);
  }

  .bottom-nav span {
    text-align: center;
    font-size: 10px;
    color: rgba(5, 0, 2, 0.5);
    font-weight: 850;
  }

  .bottom-nav span.active {
    color: var(--black);
  }

  @media (max-width: 1120px) {
    .demo-shell {
      grid-template-columns: 1fr;
      gap: 24px;
      padding: 22px 0 44px;
    }

    .side-panel,
    .right-panel {
      width: min(520px, 100%);
      margin: 0 auto;
    }

    .stage {
      min-height: auto;
    }

    .brand-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .brand-card p {
      margin: 0;
      max-width: 320px;
      text-align: right;
    }
  }

  @media (max-width: 620px) {
    .demo-shell {
      width: min(100% - 24px, 1280px);
    }

    .phone {
      width: min(390px, 100%);
      height: 760px;
    }

    .screen-tabs {
      grid-template-columns: repeat(2, 1fr);
    }

    .brand-card {
      display: grid;
    }

    .brand-card p {
      text-align: left;
    }
  }
`

export default function DemoPage() {
  const [screen, setScreen] = useState<Screen>("home")

  return (
    <main className="demo-root">
      <style>{styles}</style>

      <div className="demo-shell">
        <aside className="side-panel">
          <div className="brand-card">
            <a href="/" aria-label="Volver a Verlo">
              <VerloBrand width={118} />
            </a>
            <p>Mockup navegable de producto. No es otra landing: es la app futura simulada.</p>
          </div>

          <div className="flow-card">
            <h2>Pantallas</h2>
            <div className="screen-tabs">
              {screens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`screen-tab ${screen === item.id ? "active" : ""}`}
                  onClick={() => setScreen(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="note-card">
            <span>Investor preview</span>
            <h1>Verlo como app.</h1>
            <p>
              Un prototipo visual para mostrar matching, ficha, contacto seguro, renovación y perfil
              validado.
            </p>
          </div>
        </aside>

        <section className="stage">
          <div className="glow" />
          <div className="phone">
            {screen === "home" && <HomeScreen setScreen={setScreen} />}
            {screen === "matches" && <MatchesScreen />}
            {screen === "property" && <PropertyScreen setScreen={setScreen} />}
            {screen === "chat" && <ChatScreen />}
            {screen === "renewal" && <RenewalScreen />}
            {screen === "profile" && <ProfileScreen />}
          </div>
        </section>

        <aside className="right-panel">
          <div className="mini-stat">
            <strong>01</strong>
            <span>Captación web se convierte en usuario con magic link.</span>
          </div>

          <div className="mini-stat">
            <strong>02</strong>
            <span>El usuario navega matches y propiedades compatibles.</span>
          </div>

          <div className="mini-stat">
            <strong>03</strong>
            <span>El contacto ocurre dentro de un entorno más seguro y medible.</span>
          </div>

          <div className="mini-stat">
            <strong>04</strong>
            <span>Renovaciones y contratos pasan a ser flujos digitales monetizables.</span>
          </div>
        </aside>
      </div>
    </main>
  )
}

function AppTop() {
  return (
    <div className="app-top">
      <VerloBrand width={82} />
      <div className="avatar" />
    </div>
  )
}

function BottomNav({ active }: { active: Screen }) {
  return (
    <div className="bottom-nav">
      <span className={active === "home" ? "active" : ""}>Inicio</span>
      <span className={active === "matches" || active === "property" ? "active" : ""}>Matches</span>
      <span className={active === "chat" ? "active" : ""}>Chat</span>
      <span className={active === "profile" || active === "renewal" ? "active" : ""}>Perfil</span>
    </div>
  )
}

function HomeScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <AppTop />

      <span className="app-kicker">Cuenta confirmada</span>
      <h1 className="app-title">Hola, Juan. ¿Qué querés hacer?</h1>
      <p className="app-copy">Verlo ordena tu alquiler desde el primer contacto hasta el contrato.</p>

      <div className="choice-grid">
        <button className="choice-card" type="button" onClick={() => setScreen("matches")}>
          <div className="choice-icon">⌂</div>
          <div>
            <h3>Buscar alquiler</h3>
            <p>Ver propiedades compatibles y contactar directo.</p>
          </div>
        </button>

        <button className="choice-card" type="button" onClick={() => setScreen("property")}>
          <div className="choice-icon">＋</div>
          <div>
            <h3>Publicar propiedad</h3>
            <p>Recibir interesados filtrados y trazables.</p>
          </div>
        </button>

        <button className="choice-card" type="button" onClick={() => setScreen("renewal")}>
          <div className="choice-icon">↻</div>
          <div>
            <h3>Renovar contrato</h3>
            <p>Ordenar fecha, condiciones y próximos pasos.</p>
          </div>
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  )
}

function MatchesScreen() {
  return (
    <div className="screen">
      <AppTop />

      <span className="app-kicker">Matches para vos</span>
      <h1 className="app-title">Elegí con un swipe</h1>
      <p className="app-copy">Propiedades compatibles con tu zona, presupuesto y momento de mudanza.</p>

      <article className="property-card">
        <div className="property-image">
          <span className="badge">Dueña verificada</span>
        </div>

        <div className="property-body">
          <h3>2 ambientes en Palermo</h3>
          <p className="muted">Humboldt 1900 · Disponible ahora</p>
          <div className="price">$550.000 / mes</div>

          <div className="swipe-actions">
            <button className="round-action" type="button">×</button>
            <button className="round-action dark" type="button">♥</button>
          </div>
        </div>
      </article>

      <BottomNav active="matches" />
    </div>
  )
}

function PropertyScreen({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <AppTop />

      <span className="app-kicker">Ficha clara</span>
      <h1 className="app-title">Antes de hablar, sabés todo</h1>

      <div className="detail-image">
        <span className="badge">$550.000 / mes</span>
      </div>

      <div className="detail-card">
        <h3>2 ambientes · Palermo</h3>
        <p>Departamento luminoso, dueño verificado, contrato preparado para avanzar.</p>
      </div>

      <div className="detail-card">
        <h3>Condiciones principales</h3>
        <p>Disponible ahora · Apto pareja · Garantía a validar · Sin comisión inmobiliaria.</p>
      </div>

      <button className="cta-app" type="button" onClick={() => setScreen("chat")}>
        Me interesa
      </button>

      <BottomNav active="property" />
    </div>
  )
}

function ChatScreen() {
  return (
    <div className="screen" style={{ position: "relative" }}>
      <AppTop />

      <span className="app-kicker">Contacto seguro</span>
      <h1 className="app-title">Chat con contexto</h1>

      <div className="secure-banner">
        Contacto directo habilitado por match compatible. Ambas partes tienen datos registrados.
      </div>

      <div className="chat-list">
        <div className="bubble me">Hola, me interesa la propiedad. ¿Podemos coordinar visita?</div>
        <div className="bubble other">Sí, perfecto. Tengo disponibilidad esta semana.</div>
        <div className="bubble me">Genial. Verlo me muestra que está disponible ahora.</div>
        <div className="bubble other">Correcto. Avancemos por acá y queda todo registrado.</div>
      </div>

      <div className="message-box">
        Escribí un mensaje...
        <span className="send">→</span>
      </div>
    </div>
  )
}

function RenewalScreen() {
  return (
    <div className="screen">
      <AppTop />

      <span className="app-kicker">Renovación</span>
      <h1 className="app-title">No se pierde el hilo</h1>
      <p className="app-copy">Fecha, contraparte, objetivo y próximos pasos en un solo flujo.</p>

      <div className="timeline">
        <div className="timeline-row">
          <div className="timeline-dot">1</div>
          <div className="timeline-box">
            <h3>Contrato actual</h3>
            <p>Vence el 15/09/2026. Zona: Vicente López.</p>
          </div>
        </div>

        <div className="timeline-row">
          <div className="timeline-dot">2</div>
          <div className="timeline-box">
            <h3>Estado</h3>
            <p>La otra parte ya sabe. Falta ordenar condiciones.</p>
          </div>
        </div>

        <div className="timeline-row">
          <div className="timeline-dot">3</div>
          <div className="timeline-box">
            <h3>Objetivo</h3>
            <p>Actualizar precio y renovar con nuevo plazo.</p>
          </div>
        </div>

        <div className="timeline-row">
          <div className="timeline-dot">4</div>
          <div className="timeline-box">
            <h3>Próximo paso</h3>
            <p>Enviar resumen y preparar documentación.</p>
          </div>
        </div>
      </div>

      <BottomNav active="renewal" />
    </div>
  )
}

function ProfileScreen() {
  return (
    <div className="screen">
      <AppTop />

      <span className="app-kicker">Perfil Verlo</span>
      <h1 className="app-title">Confianza antes del contacto</h1>

      <div className="profile-card">
        <div className="profile-avatar" />
        <h3>Juan García</h3>
        <p className="muted">Inquilino · Buscando en CABA Norte</p>

        <div className="check-list">
          <div className="check-row">
            Email confirmado
            <span className="status-ok">OK</span>
          </div>

          <div className="check-row">
            WhatsApp registrado
            <span className="status-ok">OK</span>
          </div>

          <div className="check-row">
            Identidad
            <span className="status-pending">Pendiente</span>
          </div>

          <div className="check-row">
            Preferencias de búsqueda
            <span className="status-ok">OK</span>
          </div>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
