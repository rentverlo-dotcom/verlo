import Link from "next/link"
import VerloBrand from "@/components/VerloBrand"

type Role = "owner" | "tenant"

const styles = `
  .success-root {
    --pink: #f2a8a9;
    --pink-dark: #c37986;
    --black: #050002;
    --soft: #f2ebec;
    --blue: #74bedc;
    --yellow: #e7c776;
    --white: #ffffff;

    min-height: 100vh;

    background:
      radial-gradient(
        circle at 16% 14%,
        rgba(242, 168, 169, 0.42),
        transparent 32%
      ),
      radial-gradient(
        circle at 84% 84%,
        rgba(116, 190, 220, 0.28),
        transparent 30%
      ),
      var(--soft);

    color:
      var(--black);

    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .success-root * {
    box-sizing: border-box;
  }

  .success-nav {
    min-height: 72px;

    display: flex;
    align-items: center;

    border-bottom:
      1px solid
      rgba(5, 0, 2, 0.08);

    background:
      rgba(242, 235, 236, 0.80);

    backdrop-filter:
      blur(18px);

    position: sticky;
    top: 0;

    z-index: 20;
  }

  .success-container {
    width:
      min(
        760px,
        calc(100% - 32px)
      );

    margin:
      0 auto;
  }

  .success-main {
    padding:
      34px 0 56px;
  }

  .success-card {
    width:
      100%;

    padding:
      42px;

    border-radius:
      38px;

    background:
      rgba(
        255,
        255,
        255,
        0.80
      );

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    box-shadow:
      0 28px 90px
      rgba(
        5,
        0,
        2,
        0.10
      );

    backdrop-filter:
      blur(18px);
  }

  .hero {
    text-align:
      center;
  }

  .success-badge {
    width:
      fit-content;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    padding:
      9px 14px;

    border-radius:
      999px;

    background:
      rgba(
        242,
        168,
        169,
        0.24
      );

    color:
      var(--pink-dark);

    font-size:
      11px;

    font-weight:
      950;

    letter-spacing:
      0.12em;

    text-transform:
      uppercase;
  }

  .success-title {
    margin:
      18px 0 0;

    font-size:
      clamp(
        42px,
        8vw,
        70px
      );

    line-height:
      0.95;

    letter-spacing:
      -0.07em;

    font-weight:
      950;
  }

  .success-title em {
    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-style:
      italic;

    font-weight:
      400;
  }

  .success-copy {
    max-width:
      560px;

    margin:
      18px auto 0;

    color:
      rgba(
        5,
        0,
        2,
        0.62
      );

    font-size:
      17px;

    line-height:
      1.48;

    font-weight:
      650;
  }

  .success-status {
    max-width:
      560px;

    margin:
      8px auto 0;

    color:
      rgba(
        5,
        0,
        2,
        0.46
      );

    font-size:
      13px;

    line-height:
      1.4;

    font-weight:
      750;
  }

  .actions-heading {
    margin:
      34px 0 16px;

    text-align:
      center;

    font-size:
      18px;

    font-weight:
      950;

    letter-spacing:
      -0.03em;
  }

  .actions {
    display:
      grid;

    gap:
      14px;
  }

  .action-card {
    padding:
      20px;

    border-radius:
      28px;

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.07
      );
  }

  .action-card.notifications {
    background:
      linear-gradient(
        135deg,
        rgba(
          242,
          168,
          169,
          0.22
        ),
        rgba(
          255,
          255,
          255,
          0.86
        )
      );
  }

  .action-card.install {
    background:
      linear-gradient(
        135deg,
        rgba(
          116,
          190,
          220,
          0.20
        ),
        rgba(
          255,
          255,
          255,
          0.86
        )
      );
  }

  .action-card.access {
    background:
      linear-gradient(
        135deg,
        rgba(
          231,
          199,
          118,
          0.20
        ),
        rgba(
          255,
          255,
          255,
          0.86
        )
      );
  }

  .action-top {
    display:
      grid;

    grid-template-columns:
      54px 1fr;

    gap:
      14px;

    align-items:
      center;
  }

  .action-icon {
    width:
      54px;

    height:
      54px;

    display:
      grid;

    place-items:
      center;

    border-radius:
      18px;

    border:
      1px solid
      rgba(
        5,
        0,
        2,
        0.08
      );

    background:
      rgba(
        255,
        255,
        255,
        0.72
      );

    color:
      var(--black);
  }

  .action-icon svg {
    width:
      25px;

    height:
      25px;

    stroke:
      currentColor;

    stroke-width:
      2;

    fill:
      none;

    stroke-linecap:
      round;

    stroke-linejoin:
      round;
  }

  .action-content h2 {
    margin:
      0;

    font-size:
      18px;

    line-height:
      1.08;

    font-weight:
      950;

    letter-spacing:
      -0.025em;

    color:
      var(--black);
  }

  .action-content p {
    margin:
      6px 0 0;

    color:
      rgba(
        5,
        0,
        2,
        0.56
      );

    font-size:
      13px;

    line-height:
      1.4;

    font-weight:
      650;
  }

  .action-control {
    margin-top:
      16px;
  }

  .push-wrap button,
  .action-button {
    width:
      100%;

    min-height:
      54px;

    padding:
      0 22px;

    border-radius:
      999px;

    border:
      1px solid
      var(--black);

    background:
      var(--black);

    color:
      white;

    font-family:
      inherit;

    font-size:
      14px;

    font-weight:
      950;

    letter-spacing:
      -0.01em;

    cursor:
      pointer;

    transition:
      transform 160ms ease,
      opacity 160ms ease,
      box-shadow 160ms ease;
  }

  .push-wrap button:not(:disabled):hover,
  .action-button:not(:disabled):hover {
    transform:
      translateY(-2px);

    box-shadow:
      0 10px 28px
      rgba(
        5,
        0,
        2,
        0.14
      );
  }

  .push-wrap button:disabled,
  .action-button:disabled {
    opacity:
      0.48;

    cursor:
      default;
  }

  .secondary-button {
    background:
      white;

    color:
      var(--black);
  }

  .message {
    margin:
      11px 0 0;

    padding:
      12px 14px;

    border-radius:
      16px;

    font-size:
      12px;

    line-height:
      1.45;

    font-weight:
      800;
  }

  .message.ok {
    background:
      rgba(
        116,
        190,
        220,
        0.16
      );

    color:
      #255a6d;
  }

  .message.error {
    background:
      rgba(
        195,
        121,
        134,
        0.14
      );

    color:
      #7f2435;
  }

  .important-note {
    margin:
      18px 0 0;

    padding:
      14px 16px;

    border-radius:
      18px;

    background:
      rgba(
        5,
        0,
        2,
        0.045
      );

    color:
      rgba(
        5,
        0,
        2,
        0.56
      );

    font-size:
      12px;

    line-height:
      1.45;

    font-weight:
      750;

    text-align:
      center;
  }

  @media (
    max-width: 620px
  ) {
    .success-nav {
      min-height:
        64px;
    }

    .success-container {
      width:
        calc(
          100% - 24px
        );
    }

    .success-main {
      padding:
        20px 0 34px;
    }

    .success-card {
      padding:
        28px 16px;

      border-radius:
        30px;
    }

    .success-title {
      font-size:
        clamp(
          42px,
          13vw,
          58px
        );
    }

    .success-copy {
      font-size:
        15px;
    }

    .actions-heading {
      margin-top:
        28px;
    }

    .action-card {
      padding:
        16px;

      border-radius:
        24px;
    }

    .action-top {
      grid-template-columns:
        48px 1fr;

      gap:
        12px;
    }

    .action-icon {
      width:
        48px;

      height:
        48px;

      border-radius:
        15px;
    }

    .action-icon svg {
      width:
        22px;

      height:
        22px;
    }

    .action-content h2 {
      font-size:
        16px;
    }

    .action-content p {
      font-size:
        12px;
    }

    .push-wrap button,
    .action-button {
      min-height:
        52px;

      font-size:
        13px;
    }
  }
`

function Icon({ kind }: { kind: "bell" | "download" | "home" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{width:25,height:25,fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}>
    {kind === "bell" ? <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></> :
      kind === "download" ? <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></> :
      <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>}
  </svg>
}

export default function TemporarySuccess({role}: {role:Role}) {
  return <>
    <style>{styles}</style>
    <div className="success-root">
      <header className="success-nav"><div className="success-container"><VerloBrand /></div></header>
      <main className="success-main"><div className="success-container">
        <section className="success-card">
          <div className="hero">
            <div className="success-badge">Temporarios · En preparación</div>
            <h1 className="success-title">Ya estás en <em>Verlo</em></h1>
            <p className="success-copy">El próximo paso es conectar tu {role === "owner" ? "propiedad" : "búsqueda"} con alquileres temporarios compatibles.</p>
            <p className="success-status">Esta pantalla es una vista previa. Todavía no se guardó ningún registro.</p>
          </div>
          <h2 className="actions-heading">Dejá tu acceso listo cuando habilitemos Temporarios</h2>
          <div className="actions">
            <article className="action-card notifications">
              <div className="action-top">
                <div className="action-icon"><Icon kind="bell" /></div>
                <div className="action-content"><h2>ACTIVÁ LAS NOTIFICACIONES</h2><p>Te avisaremos cuando tengas coincidencias o pasos pendientes.</p></div>
              </div>
              <div className="action-control"><button className="action-button" type="button" disabled>PRÓXIMAMENTE</button></div>
            </article>
            <article className="action-card install">
              <div className="action-top">
                <div className="action-icon"><Icon kind="download" /></div>
                <div className="action-content"><h2>DESCARGÁ ACCESO DIRECTO</h2><p>Accedé a Verlo fácilmente desde tu dispositivo.</p></div>
              </div>
              <div className="action-control"><button className="action-button secondary-button" type="button" disabled>PRÓXIMAMENTE</button></div>
            </article>
            <article className="action-card access">
              <div className="action-top">
                <div className="action-icon"><Icon kind="home" /></div>
                <div className="action-content"><h2>ENTRÁ A MI VERLO</h2><p>El acceso al espacio de temporarios se habilitará cuando esté conectado el registro.</p></div>
              </div>
              <div className="action-control"><button className="action-button" type="button" disabled>PRÓXIMAMENTE</button></div>
            </article>
          </div>
          <div className="important-note">Todavía no se registran publicaciones ni búsquedas temporarias. <Link href="/temporarios" style={{textDecoration:"underline"}}>Volver a Temporarios</Link></div>
        </section>
      </div></main>
    </div>
  </>
}
