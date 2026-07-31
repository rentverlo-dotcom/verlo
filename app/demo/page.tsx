"use client"

import { useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type Screen = "home" | "matches" | "property" | "chat" | "identity" | "contract" | "signature"

const screens: { id: Screen; label: string }[] = [
  { id: "home", label: "Inicio" },
  { id: "matches", label: "Matches" },
  { id: "property", label: "Ficha" },
  { id: "chat", label: "Chat" },
  { id: "identity", label: "Identidad" },
  { id: "contract", label: "Contrato" },
  { id: "signature", label: "Firma" },
]

const styles = `
  .root {
    --pink:#f2a8a9;
    --pink-dark:#c37986;
    --black:#050002;
    --soft:#f2ebec;
    --blue:#74bedc;
    min-height:100vh;
    background:
      radial-gradient(circle at 78% 14%, rgba(242,168,169,.48), transparent 30%),
      radial-gradient(circle at 14% 18%, rgba(116,190,220,.22), transparent 24%),
      var(--soft);
    color:var(--black);
    font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  }

  .root * { box-sizing:border-box; }

  .wrap {
    min-height:100vh;
    width:min(1180px, calc(100% - 32px));
    margin:0 auto;
    display:grid;
    grid-template-columns:240px 1fr 240px;
    gap:28px;
    align-items:center;
    padding:28px 0;
  }

  .panel {
    border-radius:30px;
    background:rgba(255,255,255,.62);
    border:1px solid rgba(5,0,2,.08);
    box-shadow:0 22px 60px rgba(5,0,2,.07);
    backdrop-filter:blur(18px);
    padding:20px;
  }

  .brand p {
    margin:16px 0 0;
    color:rgba(5,0,2,.62);
    font-size:14px;
    line-height:1.45;
    font-weight:750;
  }

  .tabs {
    display:grid;
    gap:9px;
  }

  .tab {
    min-height:44px;
    border:1px solid rgba(5,0,2,.08);
    border-radius:999px;
    background:rgba(255,255,255,.62);
    color:rgba(5,0,2,.64);
    font-weight:900;
    cursor:pointer;
    padding:0 15px;
    text-align:left;
  }

  .tab.active {
    background:var(--black);
    color:white;
  }

  .side {
    display:grid;
    gap:16px;
  }

  .side h1 {
    margin:0;
    font-size:34px;
    line-height:.94;
    letter-spacing:-.07em;
  }

  .side p {
    margin:0;
    color:rgba(5,0,2,.62);
    font-size:14px;
    line-height:1.5;
  }

  .stage {
    min-height:790px;
    display:grid;
    place-items:center;
    position:relative;
  }

  .glow {
    position:absolute;
    width:680px;
    height:680px;
    border-radius:999px;
    background:
      radial-gradient(circle at 35% 30%, rgba(242,168,169,.72), transparent 31%),
      radial-gradient(circle at 70% 70%, rgba(116,190,220,.42), transparent 28%);
    filter:blur(14px);
  }

  .phone {
    position:relative;
    z-index:2;
    width:410px;
    height:790px;
    border:11px solid var(--black);
    border-radius:56px;
    background:#fffaf9;
    overflow:hidden;
    box-shadow:0 42px 110px rgba(5,0,2,.34);
  }

  .phone:before {
    content:"";
    position:absolute;
    top:13px;
    left:50%;
    transform:translateX(-50%);
    width:118px;
    height:30px;
    border-radius:999px;
    background:var(--black);
    z-index:10;
  }

  .screen {
    min-height:100%;
    padding:58px 22px 92px;
    background:
      radial-gradient(circle at 85% 4%, rgba(242,168,169,.28), transparent 24%),
      #fffaf9;
    position:relative;
  }

  .top {
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:22px;
  }

  .avatar {
    width:42px;
    height:42px;
    border-radius:999px;
    background:linear-gradient(135deg, rgba(242,168,169,.9), rgba(116,190,220,.52));
    border:2px solid white;
    box-shadow:0 8px 22px rgba(5,0,2,.12);
  }

  .pill {
    display:inline-flex;
    gap:7px;
    align-items:center;
    padding:8px 11px;
    border-radius:999px;
    background:rgba(242,168,169,.24);
    color:#8f4e5b;
    font-size:12px;
    font-weight:950;
  }

  .pill:before {
    content:"";
    width:7px;
    height:7px;
    border-radius:999px;
    background:var(--pink-dark);
  }

  .title {
    margin:15px 0 0;
    font-size:34px;
    line-height:.95;
    letter-spacing:-.075em;
    font-weight:950;
  }

  .copy {
    margin:10px 0 0;
    color:rgba(5,0,2,.58);
    font-size:14px;
    line-height:1.45;
  }

  .cards {
    display:grid;
    gap:12px;
    margin-top:22px;
  }

  .card {
    border:1px solid rgba(5,0,2,.08);
    border-radius:24px;
    background:rgba(255,255,255,.78);
    padding:16px;
    box-shadow:0 12px 30px rgba(5,0,2,.06);
  }

  .card h3 {
    margin:0;
    font-size:17px;
    letter-spacing:-.035em;
  }

  .card p {
    margin:6px 0 0;
    color:rgba(5,0,2,.58);
    font-size:12px;
    line-height:1.4;
  }

  .choice {
    display:grid;
    grid-template-columns:44px 1fr;
    gap:13px;
    align-items:center;
    width:100%;
    text-align:left;
    cursor:pointer;
  }

  .ico {
    width:44px;
    height:44px;
    border-radius:16px;
    background:rgba(242,168,169,.24);
    color:#8f4e5b;
    display:grid;
    place-items:center;
    font-weight:950;
  }

  .photo {
    height:225px;
    border-radius:28px;
    background:
      linear-gradient(180deg, transparent 44%, rgba(5,0,2,.56)),
      url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80");
    background-size:cover;
    background-position:center;
    margin-top:20px;
    position:relative;
    overflow:hidden;
  }

  .badge {
    position:absolute;
    top:14px;
    left:14px;
    padding:8px 10px;
    border-radius:999px;
    background:rgba(255,255,255,.9);
    font-size:12px;
    font-weight:950;
  }

  .price {
    margin-top:10px;
    font-size:23px;
    font-weight:950;
    letter-spacing:-.045em;
  }

  .actions {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px;
    margin-top:16px;
  }

  .round {
    min-height:56px;
    border-radius:999px;
    border:1px solid rgba(5,0,2,.08);
    background:rgba(242,168,169,.2);
    font-size:23px;
    font-weight:950;
  }

  .dark {
    background:var(--black);
    color:white;
  }

  .cta {
    width:100%;
    min-height:55px;
    border:0;
    border-radius:999px;
    background:var(--black);
    color:white;
    margin-top:14px;
    font-size:15px;
    font-weight:950;
  }

  .secure {
    margin-top:16px;
    padding:14px;
    border-radius:20px;
    background:rgba(242,168,169,.22);
    color:#7f4350;
    font-size:13px;
    line-height:1.35;
    font-weight:850;
  }

  .bubble {
    max-width:82%;
    padding:13px 14px;
    border-radius:18px;
    font-size:14px;
    line-height:1.35;
  }

  .me {
    justify-self:end;
    background:rgba(242,168,169,.24);
  }

  .other {
    justify-self:start;
    background:rgba(5,0,2,.06);
  }

  .input {
    position:absolute;
    left:22px;
    right:22px;
    bottom:22px;
    height:52px;
    border-radius:999px;
    background:white;
    border:1px solid rgba(5,0,2,.08);
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:0 9px 0 17px;
    color:rgba(5,0,2,.42);
    font-size:13px;
  }

  .send {
    width:36px;
    height:36px;
    border-radius:999px;
    background:var(--black);
    color:white;
    display:grid;
    place-items:center;
    font-weight:950;
  }

  .row {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
    padding:13px;
    border-radius:18px;
    background:rgba(5,0,2,.04);
    font-size:13px;
    font-weight:850;
  }

  .ok { color:#32785f; }
  .pending { color:#9a6a21; }

  .doc {
    margin-top:18px;
    border-radius:26px;
    background:white;
    border:1px solid rgba(5,0,2,.08);
    overflow:hidden;
  }

  .doc-head {
    padding:16px;
    background:rgba(242,168,169,.18);
    border-bottom:1px solid rgba(5,0,2,.08);
  }

  .doc-head strong {
    display:block;
    font-size:17px;
    letter-spacing:-.035em;
  }

  .doc-body {
    padding:16px;
    display:grid;
    gap:10px;
  }

  .sign-box {
    height:92px;
    border-radius:18px;
    border:1px dashed rgba(5,0,2,.22);
    background:rgba(255,255,255,.68);
    display:grid;
    place-items:center;
    font-family:Georgia,serif;
    font-size:28px;
    font-style:italic;
    color:rgba(5,0,2,.68);
  }

  .bottom {
    position:absolute;
    left:22px;
    right:22px;
    bottom:20px;
    height:58px;
    border-radius:24px;
    background:rgba(255,255,255,.92);
    border:1px solid rgba(5,0,2,.08);
    box-shadow:0 12px 34px rgba(5,0,2,.08);
    display:grid;
    grid-template-columns:repeat(4,1fr);
    align-items:center;
  }

  .bottom span {
    text-align:center;
    font-size:10px;
    color:rgba(5,0,2,.5);
    font-weight:850;
  }

  .bottom .active { color:var(--black); }

  @media (max-width:1050px) {
    .wrap { grid-template-columns:1fr; }
    .stage { min-height:auto; }
    .side { width:min(520px,100%); margin:0 auto; }
  }

  @media (max-width:540px) {
    .phone { width:min(390px,100%); height:770px; }
    .tabs { grid-template-columns:repeat(2,1fr); }
  }
`

export default function DemoPage() {
  const [screen, setScreen] = useState<Screen>("home")

  return (
    <main className="root">
      <style>{styles}</style>

      <div className="wrap">
        <aside className="side">
          <div className="panel brand">
            <a href="/" aria-label="Volver a Verlo">
              <VerloBrand width={118} />
            </a>
            <p>Mockup de app futura: matching, chat realtime interno, identidad, contrato y firma digital.</p>
          </div>

          <div className="panel tabs">
            {screens.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tab ${screen === item.id ? "active" : ""}`}
                onClick={() => setScreen(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="stage">
          <div className="glow" />
          <div className="phone">
            {screen === "home" && <Home setScreen={setScreen} />}
            {screen === "matches" && <Matches />}
            {screen === "property" && <Property setScreen={setScreen} />}
            {screen === "chat" && <Chat />}
            {screen === "identity" && <Identity />}
            {screen === "contract" && <Contract />}
            {screen === "signature" && <Signature />}
          </div>
        </section>

        <aside className="side">
          <div className="panel">
            <h1>Producto completo.</h1>
            <p>
              No es portal. Es flujo: captar, matchear, validar, conversar, documentar y firmar.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

function Top() {
  return (
    <div className="top">
      <VerloBrand width={82} />
      <div className="avatar" />
    </div>
  )
}

function Bottom({ active }: { active: string }) {
  return (
    <div className="bottom">
      <span className={active === "home" ? "active" : ""}>Inicio</span>
      <span className={active === "matches" ? "active" : ""}>Match</span>
      <span className={active === "chat" ? "active" : ""}>Chat</span>
      <span className={active === "docs" ? "active" : ""}>Docs</span>
    </div>
  )
}

function Home({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Cuenta confirmada</span>
      <h1 className="title">Hola, Juan. ¿Qué querés hacer?</h1>
      <p className="copy">Verlo ordena el alquiler desde el primer contacto hasta la firma.</p>

      <div className="cards">
        <button className="card choice" type="button" onClick={() => setScreen("matches")}>
          <div className="ico">⌂</div>
          <div><h3>Buscar alquiler</h3><p>Ver propiedades compatibles.</p></div>
        </button>

        <button className="card choice" type="button" onClick={() => setScreen("identity")}>
          <div className="ico">✓</div>
          <div><h3>Validar identidad</h3><p>Activar confianza para avanzar.</p></div>
        </button>

        <button className="card choice" type="button" onClick={() => setScreen("contract")}>
          <div className="ico">✎</div>
          <div><h3>Contrato y firma</h3><p>Revisar documento y firmar digitalmente.</p></div>
        </button>
      </div>

      <Bottom active="home" />
    </div>
  )
}

function Matches() {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Match compatible</span>
      <h1 className="title">Elegí con un swipe</h1>
      <p className="copy">Propiedades filtradas por zona, presupuesto, timing y confianza.</p>

      <div className="photo"><span className="badge">Dueña validada</span></div>

      <div className="card">
        <h3>2 ambientes en Palermo</h3>
        <p>Humboldt 1900 · Disponible ahora · Contrato listo para revisión.</p>
        <div className="price">$550.000 / mes</div>
        <div className="actions">
          <button className="round" type="button">×</button>
          <button className="round dark" type="button">♥</button>
        </div>
      </div>

      <Bottom active="matches" />
    </div>
  )
}

function Property({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Ficha clara</span>
      <h1 className="title">Antes de hablar, sabés todo</h1>

      <div className="photo"><span className="badge">$550.000 / mes</span></div>

      <div className="cards">
        <div className="card"><h3>Condiciones</h3><p>Disponible ahora · Sin comisión · Garantía a validar.</p></div>
        <div className="card"><h3>Estado documental</h3><p>Propietaria validada · Contrato borrador generado.</p></div>
      </div>

      <button className="cta" type="button" onClick={() => setScreen("chat")}>Iniciar chat interno</button>
      <Bottom active="matches" />
    </div>
  )
}

function Chat() {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Realtime interno</span>
      <h1 className="title">Chat seguro con contexto</h1>

      <div className="secure">Conversación dentro de Verlo. Match, ficha, identidad y contrato quedan conectados.</div>

      <div className="cards">
        <div className="bubble me">Hola, me interesa avanzar con esta propiedad.</div>
        <div className="bubble other">Perfecto. Ya tengo identidad validada y contrato borrador.</div>
        <div className="bubble me">Genial. Reviso condiciones y seguimos por Verlo.</div>
      </div>

      <div className="input">Escribí un mensaje... <span className="send">→</span></div>
    </div>
  )
}

function Identity() {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Validación</span>
      <h1 className="title">Identidad antes del contrato</h1>
      <p className="copy">El contacto serio necesita perfiles verificables.</p>

      <div className="cards">
        <div className="row">Email confirmado <span className="ok">OK</span></div>
        <div className="row">Teléfono registrado <span className="ok">OK</span></div>
        <div className="row">Documento <span className="pending">Pendiente</span></div>
        <div className="row">Selfie / prueba de vida <span className="pending">Pendiente</span></div>
        <div className="row">Perfil apto para firmar <span className="pending">En revisión</span></div>
      </div>

      <button className="cta" type="button">Validar identidad</button>
      <Bottom active="docs" />
    </div>
  )
}

function Contract() {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Contrato digital</span>
      <h1 className="title">Documento listo para revisar</h1>

      <div className="doc">
        <div className="doc-head">
          <strong>Contrato de alquiler</strong>
          <p className="copy">Borrador generado por Verlo</p>
        </div>

        <div className="doc-body">
          <div className="row">Propietaria <span className="ok">Validada</span></div>
          <div className="row">Inquilino <span className="ok">Validado</span></div>
          <div className="row">Precio mensual <span>$550.000</span></div>
          <div className="row">Plazo <span>24 meses</span></div>
          <div className="row">Estado <span className="pending">Revisión</span></div>
        </div>
      </div>

      <button className="cta" type="button">Enviar a firma</button>
      <Bottom active="docs" />
    </div>
  )
}

function Signature() {
  return (
    <div className="screen">
      <Top />
      <span className="pill">Firma digital</span>
      <h1 className="title">Cerrar operación sin fricción</h1>

      <div className="doc">
        <div className="doc-head">
          <strong>contrato-alquiler.pdf</strong>
          <p className="copy">ID operación: VRL-2026-0018</p>
        </div>

        <div className="doc-body">
          <div className="row">Propietaria <span className="ok">Firmado</span></div>
          <div className="row">Inquilino <span className="pending">Pendiente</span></div>
          <div className="row">Hash documento <span>9F3A…82D</span></div>
          <div className="sign-box">Firmar acá</div>
        </div>
      </div>

      <button className="cta" type="button">Firmar documento</button>
      <Bottom active="docs" />
    </div>
  )
}
