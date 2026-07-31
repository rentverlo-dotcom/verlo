"use client"

import { useState } from "react"
import VerloBrand from "@/components/VerloBrand"

type Role = "tenant" | "owner" | null

type Screen =
  | "role"
  | "tenant-search"
  | "tenant-matches"
  | "tenant-property"
  | "tenant-chat"
  | "tenant-identity"
  | "tenant-contract"
  | "tenant-signature"
  | "owner-property"
  | "owner-leads"
  | "owner-lead-profile"
  | "owner-chat"
  | "owner-contract"
  | "owner-signature"

const styles = `
  .demo-root {
    --pink: #f2a8a9;
    --pink-soft: #f9d8dc;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --muted: rgba(5,0,2,.58);
    min-height: 100vh;
    background:
      radial-gradient(circle at 50% 0%, rgba(242,168,169,.46), transparent 34%),
      radial-gradient(circle at 14% 18%, rgba(116,190,220,.18), transparent 25%),
      radial-gradient(circle at 84% 90%, rgba(242,168,169,.24), transparent 28%),
      var(--soft);
    display: grid;
    place-items: center;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--black);
  }

  .demo-root * {
    box-sizing: border-box;
  }

 .phone {
  width: min(460px, 100%);
  height: min(760px, calc(100vh - 28px));
  min-height: 660px;
    border: 11px solid var(--black);
    border-radius: 58px;
    background: #fffaf9;
    overflow: hidden;
    position: relative;
    box-shadow: 0 44px 120px rgba(5,0,2,.34);
  }

  .phone:before {
    content: "";
    position: absolute;
    z-index: 30;
    top: 13px;
    left: 50%;
    transform: translateX(-50%);
    width: 116px;
    height: 30px;
    border-radius: 999px;
    background: var(--black);
  }

 .screen {
  height: 100%;
  position: relative;
  overflow: hidden;
  padding: 54px 20px 72px;
    background:
      radial-gradient(circle at 90% 0%, rgba(242,168,169,.34), transparent 27%),
      linear-gradient(180deg, #fffaf9 0%, #fff5f4 100%);
  }

.scroll {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  padding-bottom: 28px;
}

  .scroll::-webkit-scrollbar {
    display: none;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(242,168,169,.96), rgba(116,190,220,.52));
    border: 2px solid white;
    box-shadow: 0 10px 22px rgba(5,0,2,.12);
  }

  .back {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid rgba(5,0,2,.08);
    background: white;
    display: grid;
    place-items: center;
    font-weight: 950;
    cursor: pointer;
  }

  .pill {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(242,168,169,.24);
    color: #8f4e5b;
    font-size: 12px;
    font-weight: 950;
  }

  .pill:before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--pink-dark);
  }

  .title {
    margin: 15px 0 0;
    font-size: 35px;
    line-height: .93;
    letter-spacing: -.078em;
    font-weight: 950;
  }

  .copy {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.45;
  }

  .cards {
    display: grid;
    gap: 12px;
    margin-top: 22px;
  }

  .card {
    border: 1px solid rgba(5,0,2,.08);
    border-radius: 26px;
    background: rgba(255,255,255,.84);
    padding: 16px;
    box-shadow: 0 14px 34px rgba(5,0,2,.06);
  }

  .tap-card {
    width: 100%;
    text-align: left;
    cursor: pointer;
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 14px;
    align-items: center;
  }

  .ico {
    width: 48px;
    height: 48px;
    border-radius: 17px;
    background: rgba(242,168,169,.25);
    color: #8f4e5b;
    display: grid;
    place-items: center;
    font-weight: 950;
    font-size: 19px;
  }

  .card h3,
  .tap-card h3 {
    margin: 0;
    font-size: 17px;
    line-height: 1.1;
    letter-spacing: -.04em;
  }

  .card p,
  .tap-card p {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 12.5px;
    line-height: 1.4;
  }

  .primary {
    width: 100%;
    min-height: 56px;
    border: 0;
    border-radius: 999px;
    background: var(--black);
    color: white;
    font-size: 15px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 16px 32px rgba(5,0,2,.18);
  }

  .secondary {
    width: 100%;
    min-height: 52px;
    border: 1px solid rgba(5,0,2,.09);
    border-radius: 999px;
    background: rgba(255,255,255,.78);
    color: var(--black);
    font-size: 14px;
    font-weight: 950;
    cursor: pointer;
  }

  .field {
    display: grid;
    gap: 7px;
  }

  .field label {
    color: rgba(5,0,2,.56);
    font-size: 12px;
    font-weight: 900;
  }

  .input {
    min-height: 52px;
    border-radius: 18px;
    border: 1px solid rgba(5,0,2,.08);
    background: rgba(255,255,255,.88);
    padding: 0 14px;
    display: flex;
    align-items: center;
    color: rgba(5,0,2,.78);
    font-size: 14px;
    font-weight: 800;
  }

  .photo {
    height: 244px;
    border-radius: 30px;
    margin-top: 20px;
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(180deg, transparent 42%, rgba(5,0,2,.64)),
      url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80");
    background-size: cover;
    background-position: center;
    box-shadow: 0 20px 42px rgba(5,0,2,.12);
  }

  .photo.owner {
    background:
      linear-gradient(180deg, transparent 42%, rgba(5,0,2,.64)),
      url("https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=900&q=80");
    background-size: cover;
    background-position: center;
  }

  .badge {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.92);
    font-size: 12px;
    font-weight: 950;
  }

  .photo-caption {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    color: white;
  }

  .photo-caption h3 {
    margin: 0;
    font-size: 23px;
    line-height: 1;
    letter-spacing: -.05em;
  }

  .photo-caption p {
    margin: 7px 0 0;
    font-size: 13px;
    color: rgba(255,255,255,.78);
    line-height: 1.35;
  }

  .price {
    font-size: 25px;
    letter-spacing: -.06em;
    font-weight: 950;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border-radius: 19px;
    background: rgba(5,0,2,.045);
    font-size: 13px;
    font-weight: 880;
  }

  .ok {
    color: #25745a;
    font-weight: 950;
  }

  .pending {
    color: #9a6a21;
    font-weight: 950;
  }

  .hot {
    color: #8f4e5b;
    font-weight: 950;
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
    background: rgba(242,168,169,.27);
  }

  .bubble.other {
    justify-self: start;
    background: rgba(5,0,2,.06);
  }

  .chat-input {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 22px;
    height: 52px;
    border-radius: 999px;
    background: white;
    border: 1px solid rgba(5,0,2,.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 9px 0 17px;
    color: rgba(5,0,2,.42);
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

  .doc {
    margin-top: 18px;
    border: 1px solid rgba(5,0,2,.08);
    background: white;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 16px 38px rgba(5,0,2,.07);
  }

  .doc-head {
    background: rgba(242,168,169,.2);
    border-bottom: 1px solid rgba(5,0,2,.08);
    padding: 16px;
  }

  .doc-head strong {
    display: block;
    font-size: 17px;
    letter-spacing: -.04em;
  }

  .doc-head span {
    display: block;
    margin-top: 6px;
    color: var(--muted);
    font-size: 12px;
    font-weight: 800;
  }

  .doc-body {
    padding: 15px;
    display: grid;
    gap: 10px;
  }

  .signature-box {
    height: 96px;
    border-radius: 20px;
    border: 1.5px dashed rgba(5,0,2,.24);
    background: rgba(255,255,255,.76);
    display: grid;
    place-items: center;
    font-family: Georgia, serif;
    font-size: 29px;
    font-style: italic;
    color: rgba(5,0,2,.68);
  }

  .success {
    width: 104px;
    height: 104px;
    border-radius: 999px;
    margin: 34px auto 22px;
    background: var(--black);
    color: white;
    display: grid;
    place-items: center;
    font-size: 50px;
    font-weight: 950;
    box-shadow: 0 24px 50px rgba(5,0,2,.2);
  }

  .bottom {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 18px;
    height: 58px;
    border-radius: 24px;
    background: rgba(255,255,255,.94);
    border: 1px solid rgba(5,0,2,.08);
    box-shadow: 0 12px 34px rgba(5,0,2,.08);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
  }

  .bottom button {
    border: 0;
    background: transparent;
    color: rgba(5,0,2,.45);
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .bottom button.active {
    color: var(--black);
  }

  @media (max-width: 480px) {
    .demo-root {
      padding: 12px;
    }

  .phone {
  min-height: 660px;
  height: calc(100vh - 24px);
  border-radius: 48px;
  border-width: 9px;
}

    .screen {
      padding-left: 17px;
      padding-right: 17px;
    }

    .title {
      font-size: 32px;
    }
  }
`

export default function DemoPage() {
  const [role, setRole] = useState<Role>(null)
  const [screen, setScreen] = useState<Screen>("role")

  function chooseRole(nextRole: Exclude<Role, null>) {
    setRole(nextRole)
    setScreen(nextRole === "tenant" ? "tenant-search" : "owner-property")
  }

  function reset() {
    setRole(null)
    setScreen("role")
  }

  return (
    <main className="demo-root">
      <style>{styles}</style>

      <section className="phone" aria-label="Verlo app mockup">
        {screen === "role" && <RoleScreen chooseRole={chooseRole} />}

        {role === "tenant" && screen === "tenant-search" && <TenantSearch reset={reset} setScreen={setScreen} />}
        {role === "tenant" && screen === "tenant-matches" && <TenantMatches reset={reset} setScreen={setScreen} />}
        {role === "tenant" && screen === "tenant-property" && <TenantProperty reset={reset} setScreen={setScreen} />}
        {role === "tenant" && screen === "tenant-chat" && <TenantChat reset={reset} setScreen={setScreen} />}
        {role === "tenant" && screen === "tenant-identity" && <TenantIdentity reset={reset} setScreen={setScreen} />}
        {role === "tenant" && screen === "tenant-contract" && <TenantContract reset={reset} setScreen={setScreen} />}
        {role === "tenant" && screen === "tenant-signature" && <TenantSignature reset={reset} setScreen={setScreen} />}

        {role === "owner" && screen === "owner-property" && <OwnerProperty reset={reset} setScreen={setScreen} />}
        {role === "owner" && screen === "owner-leads" && <OwnerLeads reset={reset} setScreen={setScreen} />}
        {role === "owner" && screen === "owner-lead-profile" && <OwnerLeadProfile reset={reset} setScreen={setScreen} />}
        {role === "owner" && screen === "owner-chat" && <OwnerChat reset={reset} setScreen={setScreen} />}
        {role === "owner" && screen === "owner-contract" && <OwnerContract reset={reset} setScreen={setScreen} />}
        {role === "owner" && screen === "owner-signature" && <OwnerSignature reset={reset} setScreen={setScreen} />}
      </section>
    </main>
  )
}

function Top({ reset }: { reset: () => void }) {
  return (
    <div className="top">
      <button className="back" type="button" onClick={reset}>
        ←
      </button>
      <VerloBrand width={82} />
      <div className="avatar" />
    </div>
  )
}

function Bottom({
  active,
  setScreen,
  role,
}: {
  active: "home" | "match" | "chat" | "docs"
  setScreen: (screen: Screen) => void
  role: Exclude<Role, null>
}) {
  return (
    <nav className="bottom">
      <button
        className={active === "home" ? "active" : ""}
        type="button"
        onClick={() => setScreen(role === "tenant" ? "tenant-search" : "owner-property")}
      >
        Inicio
      </button>
      <button
        className={active === "match" ? "active" : ""}
        type="button"
        onClick={() => setScreen(role === "tenant" ? "tenant-matches" : "owner-leads")}
      >
        {role === "tenant" ? "Matches" : "Interesados"}
      </button>
      <button
        className={active === "chat" ? "active" : ""}
        type="button"
        onClick={() => setScreen(role === "tenant" ? "tenant-chat" : "owner-chat")}
      >
        Chat
      </button>
      <button
        className={active === "docs" ? "active" : ""}
        type="button"
        onClick={() => setScreen(role === "tenant" ? "tenant-identity" : "owner-contract")}
      >
        Docs
      </button>
    </nav>
  )
}

function RoleScreen({ chooseRole }: { chooseRole: (role: "tenant" | "owner") => void }) {
  return (
    <div className="screen">
      <div className="scroll" style={{ display: "grid", alignContent: "center" }}>
        <div style={{ marginBottom: 28 }}>
          <VerloBrand width={140} />
        </div>

        <span className="pill">App Verlo</span>
        <h1 className="title">Elegí cómo querés entrar</h1>
        <p className="copy">
          Esta demo tiene dos productos: experiencia inquilino y experiencia propietario.
        </p>

        <div className="cards">
          <button className="card tap-card" type="button" onClick={() => chooseRole("tenant")}>
            <div className="ico">⌂</div>
            <div>
              <h3>Soy inquilino</h3>
              <p>Busco propiedad, matcheo, chateo, valido identidad y firmo.</p>
            </div>
          </button>

          <button className="card tap-card" type="button" onClick={() => chooseRole("owner")}>
            <div className="ico">＋</div>
            <div>
              <h3>Soy propietario</h3>
              <p>Publico propiedad, recibo interesados validados y envío contrato.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* INQUILINO */

function TenantSearch({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Inquilino</span>
        <h1 className="title">Armá tu búsqueda</h1>
        <p className="copy">Verlo filtra propiedades compatibles antes de mostrarte matches.</p>

        <div className="cards">
          <div className="field">
            <label>Zona</label>
            <div className="input">Palermo, Belgrano, Núñez</div>
          </div>
          <div className="field">
            <label>Presupuesto</label>
            <div className="input">$450.000 – $650.000</div>
          </div>
          <div className="field">
            <label>Fecha de mudanza</label>
            <div className="input">Dentro de 30 días</div>
          </div>
          <div className="field">
            <label>Tipo de propiedad</label>
            <div className="input">2 ambientes</div>
          </div>

          <button className="primary" type="button" onClick={() => setScreen("tenant-matches")}>
            Ver matches
          </button>
        </div>
      </div>

      <Bottom active="home" setScreen={setScreen} role="tenant" />
    </div>
  )
}

function TenantMatches({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">3 matches nuevos</span>
        <h1 className="title">Propiedades compatibles</h1>

        <article className="photo">
          <span className="badge">Dueña validada</span>
          <div className="photo-caption">
            <h3>2 ambientes en Palermo</h3>
            <p>Disponible ahora · Contrato preparado</p>
          </div>
        </article>

        <div className="card">
          <div className="price">$550.000 / mes</div>
          <p>Sin comisión · Garantía a validar · Chat interno habilitado.</p>
          <button className="primary" type="button" style={{ marginTop: 14 }} onClick={() => setScreen("tenant-property")}>
            Ver ficha
          </button>
        </div>
      </div>

      <Bottom active="match" setScreen={setScreen} role="tenant" />
    </div>
  )
}

function TenantProperty({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Ficha clara</span>
        <h1 className="title">Antes de hablar, sabés todo</h1>

        <div className="photo">
          <span className="badge">$550.000 / mes</span>
          <div className="photo-caption">
            <h3>Humboldt 1900</h3>
            <p>Palermo · 2 ambientes · Disponible</p>
          </div>
        </div>

        <div className="cards">
          <div className="row">Propietaria <span className="ok">Validada</span></div>
          <div className="row">Contrato <span className="pending">Borrador listo</span></div>
          <div className="row">Comisión <span className="ok">Sin comisión</span></div>

          <button className="primary" type="button" onClick={() => setScreen("tenant-chat")}>
            Iniciar chat interno
          </button>
        </div>
      </div>

      <Bottom active="match" setScreen={setScreen} role="tenant" />
    </div>
  )
}

function TenantChat({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Chat realtime interno</span>
        <h1 className="title">Conversación con contexto</h1>

        <div className="chat-list">
          <div className="bubble me">Hola, quiero avanzar con la propiedad.</div>
          <div className="bubble other">Perfecto. Veo que tu búsqueda encaja con las condiciones.</div>
          <div className="bubble other">Para avanzar, Verlo te pide validar identidad.</div>
          <div className="bubble me">Dale, lo hago ahora.</div>
        </div>

        <button className="secondary" type="button" style={{ marginTop: 18 }} onClick={() => setScreen("tenant-identity")}>
          Validar identidad
        </button>
      </div>

      <div className="chat-input">
        Escribí un mensaje...
        <span className="send">→</span>
      </div>
    </div>
  )
}

function TenantIdentity({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Identidad</span>
        <h1 className="title">Perfil apto para contrato</h1>

        <div className="cards">
          <div className="row">Email confirmado <span className="ok">OK</span></div>
          <div className="row">Teléfono registrado <span className="ok">OK</span></div>
          <div className="row">Documento <span className="ok">OK</span></div>
          <div className="row">Selfie / prueba de vida <span className="ok">OK</span></div>
          <div className="row">Apto para firmar <span className="ok">Aprobado</span></div>

          <button className="primary" type="button" onClick={() => setScreen("tenant-contract")}>
            Revisar contrato
          </button>
        </div>
      </div>

      <Bottom active="docs" setScreen={setScreen} role="tenant" />
    </div>
  )
}

function TenantContract({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Contrato digital</span>
        <h1 className="title">Documento listo para revisar</h1>

        <div className="doc">
          <div className="doc-head">
            <strong>Contrato de alquiler</strong>
            <span>VRL-2026-0018 · Borrador generado por Verlo</span>
          </div>
          <div className="doc-body">
            <div className="row">Propietaria <span className="ok">Validada</span></div>
            <div className="row">Inquilino <span className="ok">Validado</span></div>
            <div className="row">Precio mensual <span>$550.000</span></div>
            <div className="row">Plazo <span>24 meses</span></div>
          </div>
        </div>

        <button className="primary" type="button" style={{ marginTop: 16 }} onClick={() => setScreen("tenant-signature")}>
          Ir a firma
        </button>
      </div>

      <Bottom active="docs" setScreen={setScreen} role="tenant" />
    </div>
  )
}

function TenantSignature({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll" style={{ display: "grid", alignContent: "center", textAlign: "center" }}>
        <Top reset={reset} />
        <div className="success">✓</div>
        <span className="pill" style={{ margin: "0 auto" }}>Firma digital</span>
        <h1 className="title">Contrato firmado</h1>
        <p className="copy">La operación queda registrada con identidad, chat interno y documento conectado.</p>
      </div>

      <Bottom active="docs" setScreen={setScreen} role="tenant" />
    </div>
  )
}

/* PROPIETARIO */

function OwnerProperty({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Propietario</span>
        <h1 className="title">Tu propiedad lista para recibir interesados</h1>

        <div className="photo owner">
          <span className="badge">Publicada</span>
          <div className="photo-caption">
            <h3>2 ambientes en Palermo</h3>
            <p>$550.000 · Disponible ahora</p>
          </div>
        </div>

        <div className="cards">
          <div className="row">Estado <span className="ok">Activa</span></div>
          <div className="row">Interesados <span className="hot">7 nuevos</span></div>
          <div className="row">Contrato <span className="pending">Borrador listo</span></div>

          <button className="primary" type="button" onClick={() => setScreen("owner-leads")}>
            Ver interesados
          </button>
        </div>
      </div>

      <Bottom active="home" setScreen={setScreen} role="owner" />
    </div>
  )
}

function OwnerLeads({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Interesados filtrados</span>
        <h1 className="title">Elegí con más contexto</h1>

        <div className="cards">
          <button className="card tap-card" type="button" onClick={() => setScreen("owner-lead-profile")}>
            <div className="ico">JM</div>
            <div>
              <h3>Juan García</h3>
              <p>Presupuesto compatible · Mudanza en 30 días · Identidad aprobada.</p>
            </div>
          </button>

          <div className="card tap-card">
            <div className="ico">ML</div>
            <div>
              <h3>Martina López</h3>
              <p>Presupuesto compatible · Perfil incompleto · Documento pendiente.</p>
            </div>
          </div>

          <div className="card tap-card">
            <div className="ico">AR</div>
            <div>
              <h3>Agustín Ruiz</h3>
              <p>Consulta nueva · Falta validación · Match medio.</p>
            </div>
          </div>
        </div>
      </div>

      <Bottom active="match" setScreen={setScreen} role="owner" />
    </div>
  )
}

function OwnerLeadProfile({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Perfil interesado</span>
        <h1 className="title">Antes de hablar, ves señales reales</h1>

        <div className="cards">
          <div className="card">
            <h3>Juan García</h3>
            <p>Busca 2 ambientes en Palermo/Núñez. Presupuesto compatible.</p>
          </div>

          <div className="row">Email <span className="ok">Confirmado</span></div>
          <div className="row">Documento <span className="ok">Validado</span></div>
          <div className="row">Timing <span className="hot">Mudanza 30 días</span></div>
          <div className="row">Match score <span className="ok">92%</span></div>

          <button className="primary" type="button" onClick={() => setScreen("owner-chat")}>
            Abrir chat interno
          </button>
        </div>
      </div>

      <Bottom active="match" setScreen={setScreen} role="owner" />
    </div>
  )
}

function OwnerChat({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Chat realtime interno</span>
        <h1 className="title">Conversación trazable</h1>

        <div className="chat-list">
          <div className="bubble other">Hola, me interesa avanzar con la propiedad.</div>
          <div className="bubble me">Perfecto. Veo tu perfil validado y presupuesto compatible.</div>
          <div className="bubble me">Te envío el contrato borrador para revisar.</div>
          <div className="bubble other">Dale, lo reviso dentro de Verlo.</div>
        </div>

        <button className="secondary" type="button" style={{ marginTop: 18 }} onClick={() => setScreen("owner-contract")}>
          Generar contrato
        </button>
      </div>

      <div className="chat-input">
        Escribí un mensaje...
        <span className="send">→</span>
      </div>
    </div>
  )
}

function OwnerContract({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Contrato</span>
        <h1 className="title">Prepará documento para firma</h1>

        <div className="doc">
          <div className="doc-head">
            <strong>Contrato de alquiler</strong>
            <span>Propiedad Palermo · Interesado Juan García</span>
          </div>
          <div className="doc-body">
            <div className="row">Propietaria <span className="ok">Validada</span></div>
            <div className="row">Inquilino <span className="ok">Validado</span></div>
            <div className="row">Precio mensual <span>$550.000</span></div>
            <div className="row">Estado <span className="pending">Listo para firma</span></div>
          </div>
        </div>

        <button className="primary" type="button" style={{ marginTop: 16 }} onClick={() => setScreen("owner-signature")}>
          Enviar a firma digital
        </button>
      </div>

      <Bottom active="docs" setScreen={setScreen} role="owner" />
    </div>
  )
}

function OwnerSignature({ reset, setScreen }: { reset: () => void; setScreen: (screen: Screen) => void }) {
  return (
    <div className="screen">
      <div className="scroll">
        <Top reset={reset} />
        <span className="pill">Firma digital</span>
        <h1 className="title">Seguimiento de firmas</h1>

        <div className="doc">
          <div className="doc-head">
            <strong>contrato-alquiler.pdf</strong>
            <span>Hash 9F3A…82D · VRL-2026-0018</span>
          </div>
          <div className="doc-body">
            <div className="row">Propietaria <span className="ok">Firmado</span></div>
            <div className="row">Inquilino <span className="pending">Pendiente</span></div>
            <div className="signature-box">Esperando firma</div>
          </div>
        </div>

        <button className="primary" type="button" style={{ marginTop: 16 }}>
          Enviar recordatorio interno
        </button>
      </div>

      <Bottom active="docs" setScreen={setScreen} role="owner" />
    </div>
  )
}
